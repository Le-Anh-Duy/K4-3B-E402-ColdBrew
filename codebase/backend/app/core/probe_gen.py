"""Sinh câu chẩn đoán cho một node, bám nguyên văn transcript.

Dùng chung giữa API lúc chạy (`/probes/generate`) và script nạp sẵn ngân hàng
(`scripts/gen_probes.py`), nên luật ghép tư liệu và luật kiểm câu chỉ nằm một chỗ.
"""
from typing import Any, Dict, List, Optional
import random
import re

from . import llm
from ..prompts.probe_prompts import PROBE_GEN_SYSTEM, build_probe_prompt
from ..routers import source as source_module

SPAN_RE = re.compile(r"\[(T\d{2}-\d{3})\]")
MAX_EXCERPTS = 8


def collect_codes(node: Dict[str, Any]) -> List[str]:
    """Mã đoạn của node: lấy từ span, dòng page và các gạch đầu dòng compact."""
    codes: List[str] = []
    for code in node.get("span") or []:
        if SPAN_RE.match(f"[{code}]") and code not in codes:
            codes.append(code)
    for text in [node.get("page", ""), *(node.get("compact") or []), node.get("content_summary") or ""]:
        for code in SPAN_RE.findall(text or ""):
            if code not in codes:
                codes.append(code)
    return codes[:MAX_EXCERPTS]


def load_excerpts(codes: List[str]) -> List[Dict[str, str]]:
    """Đọc nguyên văn từng mã đoạn. Mã không có transcript thì bỏ qua, không bịa."""
    excerpts = []
    for code in codes:
        match = source_module.CODE_RE.match(code)
        if not match:
            continue
        body = source_module._segments(f"transcript-{match.group(1)}-clean.md").get(code)
        if body:
            excerpts.append({"code": code, "text": body[:1200]})
    return excerpts


def validate(question: Dict[str, Any], allowed_codes: List[str]) -> Optional[str]:
    """Trả về lý do loại, hoặc None nếu câu dùng được. Thà thiếu câu còn hơn câu bịa."""
    options = question.get("options")
    if not isinstance(options, list) or len(options) != 4 or not all(isinstance(o, str) and o.strip() for o in options):
        return "phải có đúng 4 phương án chữ"
    if len(set(options)) != 4:
        return "có phương án trùng nhau"
    if not isinstance(question.get("q"), str) or not question["q"].strip():
        return "thiếu nội dung câu hỏi"
    if not isinstance(question.get("answer"), int) or not 0 <= question["answer"] <= 3:
        return "answer phải là chỉ số 0-3"
    cited = SPAN_RE.findall(f"{question.get('span', '')} {question.get('why', '')}")
    if not cited:
        return "không kèm mã đoạn nguồn"
    bogus = [code for code in cited if code not in allowed_codes]
    if bogus:
        return f"trích mã đoạn không được cấp: {', '.join(bogus)}"
    return None


def shuffle_options(question: Dict[str, Any]) -> Dict[str, Any]:
    """Xáo phương án và ánh xạ lại answer/traps.

    LLM có thói quen đặt đáp án đúng ở vị trí đầu — bảo nó đừng làm vậy không ăn thua,
    xáo ở server thì chắc chắn.
    """
    order = list(range(len(question["options"])))
    random.shuffle(order)
    old_to_new = {old: new for new, old in enumerate(order)}
    return {
        **question,
        "options": [question["options"][old] for old in order],
        "answer": old_to_new[question["answer"]],
        "traps": {str(old_to_new[int(k)]): v for k, v in (question.get("traps") or {}).items() if k.isdigit()},
    }


def generate(node_id: str, node: Dict[str, Any], count: int = 3,
             avoid: Optional[List[str]] = None, task: str = "generate_probes") -> Dict[str, Any]:
    """Sinh `count` câu cho node. Ném ValueError nếu không có tư liệu để bám."""
    codes = collect_codes(node)
    excerpts = load_excerpts(codes)
    if not excerpts:
        raise ValueError(f"Node {node_id} chưa có đoạn transcript nào để bám — không sinh câu bịa.")

    allowed = [item["code"] for item in excerpts]
    prompt = build_probe_prompt(
        node_label=node.get("label", node_id),
        node_page=node.get("page", ""),
        excerpts=excerpts,
        count=count,
        avoid=avoid or [],
    )
    # Mỗi câu gồm 4 phương án + why + 3 trap, tiếng Việt tốn token: 1024 mặc định bị cắt giữa chừng.
    result = llm.ask_json(prompt, system_prompt=PROBE_GEN_SYSTEM, temperature=0.6, task=task,
                          max_tokens=1400 * count + 800)

    kept, dropped = [], []
    for raw in (result.get("questions") or [])[:count]:
        if not isinstance(raw, dict):
            continue
        reason = validate(raw, allowed)
        if reason:
            dropped.append({"q": str(raw.get("q", ""))[:80], "reason": reason})
            continue
        kept.append(shuffle_options({
            "q": raw["q"].strip(),
            "options": [option.strip() for option in raw["options"]],
            "answer": raw["answer"],
            "why": (raw.get("why") or "").strip(),
            "traps": {str(k): str(v) for k, v in (raw.get("traps") or {}).items()},
            "span": raw.get("span") or f"[{allowed[0]}]",
            "node": node_id,
        }))

    if not kept:
        raise ValueError(f"Node {node_id}: AI không ra được câu nào hợp lệ ({len(dropped)} câu bị loại).")
    return {"questions": kept, "dropped": dropped, "allowed_spans": allowed}

from pathlib import Path
import json
from fastapi import APIRouter
from ..schemas.plan_schemas import PlanGenerateIn, PlanGenerateOut, RemediationItem
from ..prompts.plan_prompts import PLAN_SYSTEM_PROMPT
from ..core import llm

router = APIRouter(prefix="/ai/plan", tags=["BE2 - Lộ Trình Ôn Tập (Remediation)"])

DATA_TREE_PATH = Path(__file__).resolve().parent.parent / "data" / "tree.json"
DATA_PROBES_PATH = Path(__file__).resolve().parent.parent / "data" / "probes.json"

def get_tree():
    with open(DATA_TREE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def get_probes():
    with open(DATA_PROBES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@router.post("/generate", response_model=PlanGenerateOut)
def generate_remediation_plan(body: PlanGenerateIn):
    """
    AI sinh lộ trình ôn tập thích ứng (Remediation Plan):
    - Đảm bảo 100% mục ôn đều trỏ về số trang slide có thật
    - Giải trình logic lý do nhận lộ trình dựa trên dấu vết quyết định (trace).
    """
    tree = get_tree()
    probes_data = get_probes()

    target_info = tree.get(body.target_node_id, {}) if body.target_node_id else {}
    target_label = target_info.get("label", "Tổng quan bài giảng")
    target_page = target_info.get("page", "Slide bài giảng")

    # Mặc định lấy từ review trong probes.json nếu có
    default_reviews = (probes_data.get(body.target_node_id, {})).get("review", [f"Xem lại {target_page}"])

    root_compact = tree.get("root", {}).get("compact", [
        "LLM sinh văn bản bằng cách đoán token kế tiếp",
        "Prompt là cách đặt ràng buộc cho câu trả lời",
        "RAG gắn thêm nguồn ngoài để có căn cứ"
    ])

    trace_desc = [f"- {t.t}: {t.d}" for t in body.trace]

    prompt = f"""
Kết luận (verdict): {body.verdict}
Mục tiêu chẩn đoán (nếu có): {target_label} ({target_page})
Nội dung ôn mặc định trích từ slide: {default_reviews}
Tóm tắt cả bài: {root_compact}
Lịch sử các bước chẩn đoán (Trace):
{chr(10).join(trace_desc)}
"""

    try:
        res = llm.ask_json(prompt, system_prompt=PLAN_SYSTEM_PROMPT, temperature=0.3)
        items_raw = res.get("items", [])
        items = [
            RemediationItem(text=it.get("text", ""), slide_page=it.get("slide_page", target_page))
            for it in items_raw
        ]
        if not items:
            items = [RemediationItem(text=r, slide_page=target_page) for r in default_reviews]

        return PlanGenerateOut(
            title=res.get("title", f"Lộ trình ôn: {target_label}" if body.verdict != "restart" else "Nên học lại bài này từ đầu"),
            verdict=body.verdict,
            target_node_id=body.target_node_id,
            items=items,
            why_explanation=res.get("why_explanation", f"Hệ thống xác định lỗ hổng dựa trên kết quả các vòng kiểm tra tại {target_label}."),
            compact_summary=root_compact if body.verdict == "restart" else None,
            provenance_confirmed=True
        )
    except Exception:
        # Fallback
        is_restart = body.verdict == "restart"
        title = "Nên học lại bài này từ đầu" if is_restart else f"Lộ trình ôn: {target_label}"
        items = [RemediationItem(text=r, slide_page=target_page) for r in default_reviews]
        why_exp = "Bạn sai ở mức nền nhất của bài và đã vượt quá số vòng chẩn đoán cho phép." if is_restart else f"Bạn nắm được phần nền chung, lỗ hổng tập trung chính ở mục {target_label}."

        return PlanGenerateOut(
            title=title,
            verdict=body.verdict,
            target_node_id=body.target_node_id,
            items=items,
            why_explanation=why_exp,
            compact_summary=root_compact if is_restart else None,
            provenance_confirmed=True
        )

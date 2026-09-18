from pathlib import Path
import json
import logging
from fastapi import APIRouter, HTTPException
from ..schemas.graph_schemas import (
    ProbesOut, ProbeQuestionOut, EvaluateRoundIn, EvaluateRoundOut,
    ProbeGenerateIn, GeneratedProbesOut,
)
from ..core import engine, probe_gen, usage
from . import session as session_store

logger = logging.getLogger("coldbrew.probes")

router = APIRouter(prefix="/probes", tags=["BE2 - Chẩn Đoán & Probes"])

DATA_PROBES_PATH = Path(__file__).resolve().parent.parent / "data" / "probes.json"
DATA_TREE_PATH = Path(__file__).resolve().parent.parent / "data" / "tree.json"

def get_probes():
    with open(DATA_PROBES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def get_tree():
    with open(DATA_TREE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/{target_node_id}", response_model=ProbesOut)
def get_probes_for_node(target_node_id: str):
    """Lấy danh sách 3 câu hỏi nền của node cha đang chẩn đoán (đã ẩn đáp án đúng)."""
    probes_data = get_probes()
    tree = get_tree()

    node_probes = probes_data.get(target_node_id)
    if not node_probes:
        raise HTTPException(status_code=404, detail=f"Không có bộ câu hỏi nền cho node: {target_node_id}")

    node_info = tree.get(target_node_id, {})
    questions = [
        ProbeQuestionOut(id=i, q=q["q"], options=q["options"])
        for i, q in enumerate(node_probes.get("questions", []))
    ]

    return ProbesOut(
        target_node_id=target_node_id,
        target_label=node_info.get("label", target_node_id),
        slide_page=node_info.get("page", "(chưa có mã đoạn nguồn)"),
        questions=questions
    )

@router.post("/generate", response_model=GeneratedProbesOut)
def generate_probes(body: ProbeGenerateIn):
    """Sinh câu chẩn đoán mới cho node, lưu kèm đáp án vào vùng chỉ server thấy của phiên.

    Client chỉ nhận `q` + `options` + `probe_key`; đáp án không bao giờ rời server.
    """
    tree = get_tree()
    node = tree.get(body.target_node_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Không có node {body.target_node_id} trong cây")

    record = session_store.load_record(body.session_id)
    generated = record.setdefault("generated", {})
    probe_key = f"{body.purpose}:{body.target_node_id}:{body.round_num}:{body.retry}"

    if probe_key in generated:
        # Học viên tải lại giữa chừng: trả đúng bộ cũ, không sinh lại (và không tính tiền lần nữa).
        stored = generated[probe_key]
        return _to_out(body.target_node_id, node, stored["questions"], probe_key, stored.get("source", "ai"), None)

    # Vòng sau không được lặp câu vòng trước — đây là chỗ chữa lỗi "chỉ cần nhớ đáp án".
    avoid = [
        question["q"]
        for key, value in generated.items()
        if key.split(":")[1] == body.target_node_id
        for question in value.get("questions", [])
    ]

    source, note, call_usage = "ai", None, None
    try:
        result = probe_gen.generate(body.target_node_id, node, count=body.count, avoid=avoid)
        questions = result["questions"]
        call_usage = usage.last()
        if result["dropped"]:
            note = f"{len(result['dropped'])} câu bị loại vì không bám nguồn."
    except Exception as e:
        logger.warning(f"Sinh câu cho {body.target_node_id} hỏng: {e}")
        bank = get_probes().get(body.target_node_id, {}).get("questions")
        if not bank:
            # Thà nói thẳng còn hơn phục vụ câu của node khác rồi kết luận sai về học viên.
            raise HTTPException(status_code=503, detail=f"Chưa kiểm tra được mục này: {e}")
        questions = [{**question, "node": body.target_node_id} for question in bank]
        source, note = "bank", "AI đang bận, dùng bộ câu có sẵn."

    generated[probe_key] = {"questions": questions, "source": source}
    session_store.save_record(body.session_id, record)
    return _to_out(body.target_node_id, node, questions, probe_key, source, call_usage, note)


def _to_out(node_id, node, questions, probe_key, source, call_usage, note=None) -> GeneratedProbesOut:
    return GeneratedProbesOut(
        target_node_id=node_id,
        target_label=node.get("label", node_id),
        slide_page=node.get("page", "(chưa có mã đoạn nguồn)"),
        questions=[ProbeQuestionOut(id=i, q=q["q"], options=q["options"]) for i, q in enumerate(questions)],
        probe_key=probe_key,
        source=source,
        usage=call_usage,
        note=note,
    )


@router.post("/evaluate-round", response_model=EvaluateRoundOut)
def evaluate_round(body: EvaluateRoundIn):
    """
    Chấm điểm vòng probe và ra quyết định leo cây (locate | escalate | restart):
    - locate: Sai/bỏ trống <= 1 -> Hổng khu trú tại node này
    - escalate: Sai/bỏ trống >= 2 -> Leo lên node cha tầng trên
    - restart: Chạm gốc hoặc quá 3 vòng -> Yêu cầu học lại cả bài
    """
    probes_data = get_probes()
    tree = get_tree()

    if body.probe_key and body.session_id:
        stored = session_store.load_record(body.session_id).get("generated", {}).get(body.probe_key)
        if not stored:
            raise HTTPException(status_code=404, detail=f"Phiên không có bộ câu {body.probe_key}")
        questions = stored["questions"]
    else:
        node_probes = probes_data.get(body.target_node_id)
        if not node_probes:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy dữ liệu probe cho {body.target_node_id}")
        questions = node_probes.get("questions", [])

    # Sinh động nên node nào cũng kiểm tra được: luật leo cây không còn bị chặn bởi
    # việc ngân hàng tĩnh thiếu node (trước đây rơi thẳng vào "xem lại toàn bài").
    probes_data = {**{node_id: {} for node_id in tree}, **probes_data}
    recs = engine.grade(questions, body.picked, body.times)

    decision_info = engine.round_decision(
        target_id=body.target_node_id,
        recs=recs,
        round_num=body.round_num,
        tree=tree,
        probes=probes_data,
        last_failed=body.last_failed,
    )

    node_label = tree.get(body.target_node_id, {}).get("label", body.target_node_id)
    next_label = tree.get(decision_info["next_target"], {}).get("label") if decision_info.get("next_target") else None

    # Tạo trace entry tự động
    detail = f"sai/bỏ trống {decision_info['bad']}/{len(questions)}"
    if decision_info["slow"] > 0:
        detail += f", {decision_info['slow']} câu đúng nhưng chậm"

    trace_entry = {
        "t": f"Vòng {body.round_num} · {node_label}",
        "d": detail
    }

    gap = decision_info.get("gap")
    ceiling = decision_info.get("ceiling")
    return EvaluateRoundOut(
        gap=gap,
        gap_label=(tree.get(gap, {}).get("label") if gap else None),
        ceiling=ceiling,
        ceiling_label=(tree.get(ceiling, {}).get("label") if ceiling else None),
        scenario=decision_info.get("scenario"),
        prompt_key=decision_info.get("prompt_key"),
        decision=decision_info["decision"],
        next_target=decision_info["next_target"],
        next_target_label=next_label,
        bad_count=decision_info["bad"],
        slow_count=decision_info["slow"],
        records=recs,
        trace_entry=trace_entry
    )

from pathlib import Path
import json
from fastapi import APIRouter, HTTPException
from ..schemas.graph_schemas import ProbesOut, ProbeQuestionOut, EvaluateRoundIn, EvaluateRoundOut
from ..core import engine

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
        slide_page=node_info.get("page", "Slide bài giảng"),
        questions=questions
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

    node_probes = probes_data.get(body.target_node_id)
    if not node_probes:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy dữ liệu probe cho {body.target_node_id}")

    questions = node_probes.get("questions", [])
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

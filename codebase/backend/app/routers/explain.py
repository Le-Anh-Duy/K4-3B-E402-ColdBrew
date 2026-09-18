from pathlib import Path
import json
from fastapi import APIRouter
from ..schemas.explain_schemas import ExplainSingleIn, ExplainSingleOut, ExplainRoundIn, ExplainRoundOut
from ..prompts.explain_prompts import EXPLAIN_SINGLE_SYSTEM, EXPLAIN_ROUND_SYSTEM
from ..core import llm

router = APIRouter(prefix="/ai/explain", tags=["BE1 - AI Explain"])

DATA_TREE_PATH = Path(__file__).resolve().parent.parent / "data" / "tree.json"
DATA_QUIZ_PATH = Path(__file__).resolve().parent.parent / "data" / "quiz.json"

def get_tree():
    with open(DATA_TREE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def get_quiz_item(node_id: str):
    with open(DATA_QUIZ_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)
    for q in items:
        if q.get("node") == node_id:
            return q
    return None

@router.post("/single", response_model=ExplainSingleOut)
def explain_single(body: ExplainSingleIn):
    """
    AI #1: Phân tích 1 câu hỏi cụ thể.
    - Giải thích vì sao đáp án đúng là đúng.
    - Phân tích bẫy nếu học viên chọn sai.
    - Cảnh báo thời gian làm bài (rush / slow).
    """
    tree = get_tree()
    node_info = tree.get(body.node_id, {})
    slide_page = node_info.get("page", "Slide bài giảng")
    quiz_item = get_quiz_item(body.node_id) or {}

    selected_text = body.options[body.selected_idx] if body.selected_idx is not None and body.selected_idx < len(body.options) else "Bỏ trống"
    correct_text = body.options[body.correct_idx] if body.correct_idx < len(body.options) else ""

    prompt = f"""
Câu hỏi: {body.question}
Các lựa chọn: {body.options}
Đáp án đúng: {correct_text} (lựa chọn số {body.correct_idx})
Học viên đã chọn: {selected_text} (lựa chọn số {body.selected_idx})
Thời gian trả lời: {body.time_sec} giây (Cờ: {body.flag})
Concept node: {node_info.get('label', body.node_id)}
Nguồn trích dẫn: {slide_page}
Tóm tắt concept: {node_info.get('content_summary', '')}
"""
    try:
        res = llm.ask_json(prompt, system_prompt=EXPLAIN_SINGLE_SYSTEM, temperature=0.2)
        return ExplainSingleOut(
            why=res.get("why", quiz_item.get("why", "Đáp án đúng dựa trên định nghĩa trong bài học.")),
            trap=res.get("trap", (quiz_item.get("traps") or {}).get(str(body.selected_idx))),
            timing_note=res.get("timing_note"),
            slide_page=slide_page
        )
    except Exception:
        # Fallback nếu LLM offline hoặc chưa nạp API key
        fallback_traps = quiz_item.get("traps", {})
        trap_msg = fallback_traps.get(str(body.selected_idx)) if body.selected_idx is not None else None
        timing_note = None
        if body.flag == "rush":
            timing_note = f"Chỉ mất {body.time_sec}s — nhanh hơn thời gian đọc đề, có thể do bấm vội."
        elif body.flag == "slow":
            timing_note = f"Đúng nhưng mất {body.time_sec}s (> 25s) — nên xem lại phần này cho chắc."

        return ExplainSingleOut(
            why=quiz_item.get("why", f"Khái niệm này được trình bày tại {slide_page}."),
            trap=trap_msg,
            timing_note=timing_note,
            slide_page=slide_page
        )

@router.post("/round", response_model=ExplainRoundOut)
def explain_round(body: ExplainRoundIn):
    """
    AI #1: Nhận xét sư phạm gộp cho cả vòng câu hỏi chẩn đoán nền.
    """
    tree = get_tree()
    node_info = tree.get(body.target_node_id, {})
    slide_page = node_info.get("page", "Slide bài giảng")

    questions_summary = []
    bad_count = 0
    for i, r in enumerate(body.records):
        is_bad = r.selected_idx != r.correct_idx
        if is_bad:
            bad_count += 1
        sel_text = r.options[r.selected_idx] if r.selected_idx is not None and r.selected_idx < len(r.options) else "Bỏ trống"
        corr_text = r.options[r.correct_idx]
        questions_summary.append(
            f"- Câu {i+1}: {r.question} | Học viên chọn: {sel_text} | Đáp án: {corr_text} | Thời gian: {r.sec}s ({r.flag})"
        )

    prompt = f"""
Mục đang kiểm tra: {node_info.get('label', body.target_node_id)} ({slide_page})
Vòng chẩn đoán số: {body.round_num}
Quyết định của hệ thống: {body.decision}
Chi tiết các câu trong vòng:
{chr(10).join(questions_summary)}
"""
    try:
        res = llm.ask_json(prompt, system_prompt=EXPLAIN_ROUND_SYSTEM, temperature=0.3)
        return ExplainRoundOut(
            summary=res.get("summary", f"Bạn làm sai {bad_count}/{len(body.records)} câu ở phần nền của {node_info.get('label')}."),
            per_question_notes=res.get("per_question_notes", []),
            advice=res.get("advice", "Hãy đọc lại slide nguồn trước khi tiếp tục.")
        )
    except Exception:
        # Fallback
        notes = []
        for r in body.records:
            if r.selected_idx == r.correct_idx:
                notes.append("Đã nắm vững ý này.")
            else:
                notes.append("Cần xem lại định nghĩa trong slide.")

        if body.decision == "locate":
            advice = f"Phần nền của {node_info.get('label')} tương đối ổn. Chỗ cần củng cố nằm chính ở mục này chứ không phải cả chương."
        elif body.decision == "escalate":
            advice = f"Bạn sai ngay ở mức nền của mục này, nhiều khả năng vấn đề nằm ở kiến thức gốc phía trên."
        else:
            advice = "Bạn sai ở mức nền nhất của bài — nên xem lại toàn bộ bài giảng."

        return ExplainRoundOut(
            summary=f"Kết quả vòng {body.round_num}: sai/bỏ trống {bad_count}/{len(body.records)} câu.",
            per_question_notes=notes,
            advice=advice
        )

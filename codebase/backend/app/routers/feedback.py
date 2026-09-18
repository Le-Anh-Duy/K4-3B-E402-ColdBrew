from pathlib import Path
import json
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from ..schemas.feedback_schemas import FeedbackIn, FeedbackOut

router = APIRouter(tags=["BE2 - Đánh Giá & Nhận Xét (Feedback)"])

FEEDBACKS_DIR = Path(__file__).resolve().parent.parent / "data" / "feedbacks"
FEEDBACKS_DIR.mkdir(parents=True, exist_ok=True)
SESSIONS_DIR = Path(__file__).resolve().parent.parent / "data" / "sessions"

def _save_feedback_record(feedback_data: FeedbackIn, session_id: Optional[str] = None) -> FeedbackOut:
    fb_id = str(uuid.uuid4())
    effective_session_id = session_id or feedback_data.session_id
    now_iso = datetime.now().isoformat()

    record = {
        "id": fb_id,
        "session_id": effective_session_id,
        "stars": feedback_data.stars,
        "reasons": feedback_data.reasons or [],
        "comment": feedback_data.comment or "",
        "node_id": feedback_data.node_id,
        "topic": feedback_data.topic,
        "created_at": now_iso
    }

    # 1. Lưu file riêng từng feedback
    file_path = FEEDBACKS_DIR / f"{fb_id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(record, f, ensure_ascii=False, indent=2)

    # 2. Nếu có session_id, cập nhật trực tiếp vào session json
    if effective_session_id:
        session_file = SESSIONS_DIR / f"{effective_session_id}.json"
        if session_file.exists():
            try:
                with open(session_file, "r", encoding="utf-8") as sf:
                    session_state = json.load(sf)
                session_state["feedback"] = record
                with open(session_file, "w", encoding="utf-8") as sf:
                    json.dump(session_state, sf, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"Lỗi khi cập nhật feedback vào session: {e}")

    return FeedbackOut(
        ok=True,
        id=fb_id,
        session_id=effective_session_id,
        stars=record["stars"],
        reasons=record["reasons"],
        comment=record["comment"],
        node_id=record["node_id"],
        topic=record["topic"],
        created_at=record["created_at"],
        message="Đã lưu nhận xét và đánh giá phiên học thành công"
    )

@router.post("/feedback", response_model=FeedbackOut)
def submit_feedback(body: FeedbackIn):
    """
    Gửi nhận xét và đánh giá sao (1-5 sao kèm tag lý do và nhận xét đóng góp) về phiên quiz/lộ trình.
    """
    return _save_feedback_record(body, session_id=body.session_id)

@router.post("/session/{session_id}/feedback", response_model=FeedbackOut)
def submit_session_feedback(session_id: str, body: FeedbackIn):
    """
    Gửi nhận xét và đánh giá cho phiên học cụ thể theo session_id.
    """
    return _save_feedback_record(body, session_id=session_id)

@router.get("/session/{session_id}/feedback", response_model=Optional[FeedbackOut])
def get_session_feedback(session_id: str):
    """
    Lấy nhận xét đã lưu của một phiên làm việc (nếu có).
    """
    session_file = SESSIONS_DIR / f"{session_id}.json"
    if not session_file.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên làm việc")

    with open(session_file, "r", encoding="utf-8") as sf:
        session_state = json.load(sf)

    fb = session_state.get("feedback")
    if not fb:
        raise HTTPException(status_code=404, detail="Phiên làm việc này chưa có nhận xét")

    return FeedbackOut(
        ok=True,
        id=fb.get("id", ""),
        session_id=session_id,
        stars=fb.get("stars", 5),
        reasons=fb.get("reasons", []),
        comment=fb.get("comment", ""),
        node_id=fb.get("node_id"),
        topic=fb.get("topic"),
        created_at=fb.get("created_at", datetime.now().isoformat()),
        message="Lấy nhận xét thành công"
    )

@router.get("/feedback", response_model=List[FeedbackOut])
def list_feedbacks(limit: int = Query(20, ge=1, le=100)):
    """
    Lấy danh sách các nhận xét gần nhất từ học viên.
    """
    records = []
    if FEEDBACKS_DIR.exists():
        files = sorted(FEEDBACKS_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        for f in files[:limit]:
            try:
                with open(f, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                    records.append(FeedbackOut(
                        ok=True,
                        id=data.get("id", f.stem),
                        session_id=data.get("session_id"),
                        stars=data.get("stars", 5),
                        reasons=data.get("reasons", []),
                        comment=data.get("comment", ""),
                        node_id=data.get("node_id"),
                        topic=data.get("topic"),
                        created_at=data.get("created_at", ""),
                        message="Thành công"
                    ))
            except Exception:
                continue
    return records

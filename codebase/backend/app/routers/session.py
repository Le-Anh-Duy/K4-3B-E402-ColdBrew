from pathlib import Path
import json
import uuid
from fastapi import APIRouter, HTTPException
from ..schemas.plan_schemas import SessionStateIn, SessionOut

router = APIRouter(prefix="/session", tags=["BE2 - Quản Lý Phiên (Learner State)"])

SESSIONS_DIR = Path(__file__).resolve().parent.parent / "data" / "sessions"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("", response_model=SessionOut)
def create_session():
    """Tạo một phiên làm việc mới cho học viên và cấp session_id."""
    session_id = str(uuid.uuid4())
    default_state = {
        "stage": "home",
        "records": [],
        "target": None,
        "round": 0,
        "retry": 0,
        "hits": [],
        "round_recs": [],
        "decision": None,
        "next_target": None,
        "trace": [],
        "status": {},
        "verdict": None
    }
    file_path = SESSIONS_DIR / f"{session_id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(default_state, f, ensure_ascii=False, indent=2)

    return SessionOut(session_id=session_id, state=default_state)

@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: str):
    """Khôi phục phiên làm việc trước đó của học viên từ file JSON."""
    file_path = SESSIONS_DIR / f"{session_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên làm việc")

    with open(file_path, "r", encoding="utf-8") as f:
        state = json.load(f)

    return SessionOut(session_id=session_id, state=state)

@router.put("/{session_id}", response_model=SessionOut)
def update_session(session_id: str, body: SessionStateIn):
    """Cập nhật trạng thái tiến trình của học viên vào file JSON (Spec §0)."""
    file_path = SESSIONS_DIR / f"{session_id}.json"
    state_dict = body.model_dump()

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(state_dict, f, ensure_ascii=False, indent=2)

    return SessionOut(session_id=session_id, state=state_dict)

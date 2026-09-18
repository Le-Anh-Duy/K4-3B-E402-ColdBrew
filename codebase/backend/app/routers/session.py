"""Kho phiên học trên đĩa: giữ nguyên vẹn cả đề, cây tri thức và flow state.

Lộ trình ôn do AI sinh nằm trong state, nên state phải được lưu NGUYÊN VẸN —
không whitelist trường, không đổi tên khoá. Frontend gửi sao thì đĩa giữ vậy.
"""
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import json
import uuid

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/session", tags=["BE2 - Quản Lý Phiên (Learner State)"])

SESSIONS_DIR = Path(__file__).resolve().parent.parent / "data" / "sessions"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_STATE: Dict[str, Any] = {"stage": "home", "records": [], "trace": [], "status": {}}


class SessionIn(BaseModel):
    """Mọi trường đều tuỳ chọn: tạo phiên rỗng, hay ghi đè từng phần đều dùng chung."""
    owner: Optional[str] = None
    session: Optional[Dict[str, Any]] = None  # vỏ phiên: đề, cây, topic, document
    state: Optional[Dict[str, Any]] = None    # flow state, giữ nguyên khoá của frontend
    completed: Optional[bool] = None


class SessionOut(BaseModel):
    session_id: str
    state: Dict[str, Any] = Field(default_factory=dict)
    owner: Optional[str] = None
    session: Optional[Dict[str, Any]] = None
    completed: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class SessionSummary(BaseModel):
    session_id: str
    owner: Optional[str] = None
    topic: Optional[str] = None
    document_title: Optional[str] = None
    stage: Optional[str] = None
    completed: bool = False
    has_plan: bool = False
    updated_at: Optional[str] = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _path(session_id: str) -> Path:
    # Chặn ../ và tên lạ: session_id do backend cấp nên luôn là UUID.
    try:
        uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="session_id không hợp lệ")
    return SESSIONS_DIR / f"{session_id}.json"


def _read(path: Path) -> Dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    # File từ bản cũ là state phẳng, không có khoá "state".
    if "state" not in data:
        return {"session_id": path.stem, "state": data, "completed": False}
    return data


def _write(path: Path, record: Dict[str, Any]) -> Dict[str, Any]:
    record["updated_at"] = _now()
    path.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    return record


def load_record(session_id: str) -> Dict[str, Any]:
    """Đọc bản ghi phiên đầy đủ, KỂ CẢ vùng chỉ server thấy (`generated`)."""
    path = _path(session_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên làm việc")
    return _read(path)


def save_record(session_id: str, record: Dict[str, Any]) -> Dict[str, Any]:
    """Ghi lại bản ghi phiên. Chỉ router phía server gọi, không mở ra thành endpoint."""
    return _write(_path(session_id), record)


@router.post("", response_model=SessionOut)
def create_session(body: Optional[SessionIn] = None):
    """Tạo phiên mới. Có thể gửi luôn owner và vỏ phiên để resume được ở máy khác."""
    body = body or SessionIn()
    session_id = str(uuid.uuid4())
    record = {
        "session_id": session_id,
        "owner": body.owner,
        "session": body.session,
        "state": body.state or dict(DEFAULT_STATE),
        "completed": bool(body.completed),
        "created_at": _now(),
    }
    return SessionOut(**_write(_path(session_id), record))


@router.get("", response_model=List[SessionSummary])
def list_sessions(owner: Optional[str] = Query(None), limit: int = Query(20, ge=1, le=100)):
    """Danh sách phiên của một học viên, mới nhất trước — để khôi phục và xem lại lộ trình cũ."""
    records = []
    for path in SESSIONS_DIR.glob("*.json"):
        try:
            record = _read(path)
        except (OSError, json.JSONDecodeError):
            continue
        if owner and record.get("owner") != owner:
            continue
        state = record.get("state") or {}
        session = record.get("session") or {}
        records.append(SessionSummary(
            session_id=record.get("session_id", path.stem),
            owner=record.get("owner"),
            topic=session.get("topic"),
            document_title=(session.get("document") or {}).get("title"),
            stage=state.get("stage"),
            completed=bool(record.get("completed")),
            has_plan=bool(state.get("plan")),
            updated_at=record.get("updated_at"),
        ))
    records.sort(key=lambda item: item.updated_at or "", reverse=True)
    return records[:limit]


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: str):
    """Khôi phục phiên: trả cả vỏ phiên lẫn flow state đúng như lúc lưu."""
    path = _path(session_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên làm việc")
    return SessionOut(**_read(path))


@router.put("/{session_id}", response_model=SessionOut)
def update_session(session_id: str, body: SessionIn):
    """Ghi đè từng phần. Trường nào không gửi thì giữ nguyên giá trị cũ trên đĩa."""
    path = _path(session_id)
    record = _read(path) if path.exists() else {"session_id": session_id, "created_at": _now()}
    for field in ("owner", "session", "state", "completed"):
        value = getattr(body, field)
        if value is not None:
            record[field] = value
    record.setdefault("state", dict(DEFAULT_STATE))
    record["completed"] = bool(record.get("completed"))
    return SessionOut(**_write(path, record))


@router.delete("/{session_id}")
def delete_session(session_id: str):
    """Dọn phiên bỏ dở để kho không phình mãi."""
    path = _path(session_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên làm việc")
    path.unlink()
    return {"deleted": session_id}

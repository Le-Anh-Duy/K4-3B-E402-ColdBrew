"""Trả nguyên văn đoạn transcript theo mã đoạn [Txx-NNN] để UI hiện trích dẫn."""
from functools import lru_cache
from pathlib import Path
import re

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/source", tags=["BE2 - Trích nguồn"])

# ponytail: đọc thẳng file transcript ở máy chạy. /data/ bị .gitignore (xem DATA_NOTICE.md)
# nên bản clone sạch sẽ 404 và UI hiện thông báo — dựng index/DB khi cần deploy thật.
TRANSCRIPT_DIR = Path(__file__).resolve().parents[4] / "data" / "vlearn-pack" / "transcript"
CODE_RE = re.compile(r"^T(\d{2})-(\d{3})$")
SEGMENT_RE = re.compile(r"\*\*\[(T\d{2}-\d{3})\]\*\*\s*(.*?)(?=\n\*\*\[T\d{2}-\d{3}\]\*\*|\Z)", re.S)
MAX_CHARS = 1200


@lru_cache(maxsize=16)
def _segments(file_name: str) -> dict[str, str]:
    path = TRANSCRIPT_DIR / file_name
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")
    return {code: body.strip() for code, body in SEGMENT_RE.findall(text)}


@router.get("/{code}")
def get_source(code: str):
    """Ví dụ: GET /api/v0/source/T06-136 -> nguyên văn đoạn T06-136."""
    normalized = code.strip().upper()
    match = CODE_RE.match(normalized)
    if not match:
        raise HTTPException(status_code=400, detail="Mã đoạn phải có dạng T06-136")
    file_name = f"transcript-{match.group(1)}-clean.md"
    body = _segments(file_name).get(normalized)
    if not body:
        raise HTTPException(status_code=404, detail=f"Không có đoạn nguồn {code} trong repo này")
    return {
        "code": normalized,
        "file": file_name,
        "text": body[:MAX_CHARS] + ("…" if len(body) > MAX_CHARS else ""),
    }

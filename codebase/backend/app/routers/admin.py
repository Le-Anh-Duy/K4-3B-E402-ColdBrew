"""Trang quản trị: nạp transcript lên server đang chạy và xem sổ token.

Cần thiết vì data pack không được commit (DATA_NOTICE.md), nên bản deploy khởi
động với thư mục transcript rỗng — không có đường nào khác để đưa nguồn vào.
"""
from pathlib import Path
from typing import List
import json
import re
import secrets

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile

from ..core import usage
from ..core.config import ADMIN_TOKEN
from . import source as source_router

router = APIRouter(prefix="/admin", tags=["Admin"])

TRANSCRIPT_NAME_RE = re.compile(r"^transcript-\d{2}-clean\.md$")
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # một transcript sạch ~200KB; 5MB là dư sức
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def require_admin(x_admin_token: str = Header(default="")) -> None:
    """Khoá mặc định: chưa đặt ADMIN_TOKEN thì không ai vào được."""
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="Chưa cấu hình ADMIN_TOKEN trên server")
    if not secrets.compare_digest(x_admin_token, ADMIN_TOKEN):
        raise HTTPException(status_code=401, detail="Sai token quản trị")


@router.post("/login", dependencies=[Depends(require_admin)])
def admin_login():
    """Chỉ để trang admin kiểm tra token trước khi hiện giao diện."""
    return {"ok": True}


@router.get("/status", dependencies=[Depends(require_admin)])
def admin_status():
    """Server đang có gì: transcript nào, cây bao nhiêu node, đề bao nhiêu câu, token đã dùng."""
    transcripts = []
    if source_router.TRANSCRIPT_DIR.exists():
        for path in sorted(source_router.TRANSCRIPT_DIR.glob("transcript-*-clean.md")):
            transcripts.append({
                "name": path.name,
                "bytes": path.stat().st_size,
                "segments": len(source_router._segments(path.name)),
            })

    def count_json(name: str) -> int:
        path = DATA_DIR / name
        if not path.exists():
            return 0
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return 0
        return len(data)

    return {
        "transcript_dir": str(source_router.TRANSCRIPT_DIR),
        "transcripts": transcripts,
        "transcript_segments": sum(item["segments"] for item in transcripts),
        "tree_nodes": count_json("tree.json"),
        "quiz_questions": count_json("quiz.json"),
        "probe_nodes": count_json("probes.json"),
        "sessions": len(list((DATA_DIR / "sessions").glob("*.json"))) if (DATA_DIR / "sessions").exists() else 0,
        "usage": usage.summary(),
    }


@router.post("/transcripts", dependencies=[Depends(require_admin)])
async def upload_transcripts(files: List[UploadFile] = File(...)):
    """Nạp transcript. Chỉ nhận đúng tên `transcript-NN-clean.md`, ghi đè bản cũ."""
    source_router.TRANSCRIPT_DIR.mkdir(parents=True, exist_ok=True)
    saved, rejected = [], []

    for upload in files:
        name = Path(upload.filename or "").name  # cắt mọi thành phần thư mục
        if not TRANSCRIPT_NAME_RE.match(name):
            rejected.append({"name": upload.filename, "reason": "Tên phải dạng transcript-01-clean.md"})
            continue
        body = await upload.read()
        if len(body) > MAX_UPLOAD_BYTES:
            rejected.append({"name": name, "reason": f"Quá {MAX_UPLOAD_BYTES // 1024 // 1024}MB"})
            continue
        try:
            text = body.decode("utf-8")
        except UnicodeDecodeError:
            rejected.append({"name": name, "reason": "File phải là UTF-8"})
            continue

        (source_router.TRANSCRIPT_DIR / name).write_text(text, encoding="utf-8")
        # Bộ nhớ đệm của /source giữ bản cũ, không xoá thì file vừa nạp vẫn 404.
        source_router._segments.cache_clear()
        saved.append({"name": name, "bytes": len(body), "segments": len(source_router._segments(name))})

    if not saved and rejected:
        raise HTTPException(status_code=400, detail=rejected[0]["reason"])
    return {"saved": saved, "rejected": rejected}

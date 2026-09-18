"""Sổ ghi token mỗi lần gọi LLM, để báo cáo chi phí theo từng tác vụ.

Một dòng JSON cho mỗi lời gọi (JSONL) — nối đuôi nên không bao giờ mất bản ghi cũ,
và đọc lại bằng vài dòng Python. ponytail: đủ cho mức hackathon; đổi sang SQLite
khi cần truy vấn theo khoảng thời gian hoặc nhiều tiến trình ghi song song.
"""
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import contextvars
import json
import logging

logger = logging.getLogger("coldbrew.usage")

USAGE_PATH = Path(__file__).resolve().parent.parent / "data" / "usage.jsonl"

# Bản ghi của lời gọi gần nhất TRONG CÙNG request — contextvar nên không lẫn giữa
# các request chạy song song trong threadpool của FastAPI.
_last: contextvars.ContextVar[Optional[Dict[str, Any]]] = contextvars.ContextVar("coldbrew_last_usage", default=None)


def last() -> Optional[Dict[str, Any]]:
    """Token của lời gọi LLM gần nhất, để router đính kèm vào response cho UI."""
    return _last.get()


def _int(value: Any) -> int:
    return int(value) if isinstance(value, (int, float)) else 0


def record(task: str, model: str, usage: Any, latency_ms: int, ok: bool = True, error: Optional[str] = None) -> Dict[str, Any]:
    """Ghi một lời gọi. Không bao giờ ném lỗi ra ngoài: đo đạc không được làm hỏng tính năng."""
    details = getattr(usage, "completion_tokens_details", None)
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "task": task,
        "model": model,
        "prompt_tokens": _int(getattr(usage, "prompt_tokens", 0)),
        "completion_tokens": _int(getattr(usage, "completion_tokens", 0)),
        "total_tokens": _int(getattr(usage, "total_tokens", 0)),
        "reasoning_tokens": _int(getattr(details, "reasoning_tokens", 0)),
        "latency_ms": latency_ms,
        "ok": ok,
    }
    if error:
        entry["error"] = error[:200]
    _last.set(entry)
    try:
        USAGE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(USAGE_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except OSError as e:
        logger.warning(f"Không ghi được sổ token: {e}")
    return entry


def read_all() -> List[Dict[str, Any]]:
    if not USAGE_PATH.exists():
        return []
    entries = []
    for line in USAGE_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return entries


def summary() -> Dict[str, Any]:
    """Gộp theo tác vụ: số lời gọi, token vào/ra, trung bình mỗi lời gọi, độ trễ."""
    entries = read_all()
    by_task: Dict[str, Dict[str, Any]] = {}
    for entry in entries:
        row = by_task.setdefault(entry.get("task", "unknown"), {
            "task": entry.get("task", "unknown"), "calls": 0, "failed": 0,
            "prompt_tokens": 0, "completion_tokens": 0, "reasoning_tokens": 0,
            "total_tokens": 0, "latency_ms": 0,
        })
        row["calls"] += 1
        if not entry.get("ok", True):
            row["failed"] += 1
        for field in ("prompt_tokens", "completion_tokens", "reasoning_tokens", "total_tokens", "latency_ms"):
            row[field] += _int(entry.get(field))

    tasks = []
    for row in by_task.values():
        calls = row["calls"] or 1
        row["avg_total_tokens"] = round(row["total_tokens"] / calls, 1)
        row["avg_latency_ms"] = round(row["latency_ms"] / calls)
        tasks.append(row)
    tasks.sort(key=lambda row: row["total_tokens"], reverse=True)

    return {
        "calls": len(entries),
        "prompt_tokens": sum(row["prompt_tokens"] for row in tasks),
        "completion_tokens": sum(row["completion_tokens"] for row in tasks),
        "reasoning_tokens": sum(row["reasoning_tokens"] for row in tasks),
        "total_tokens": sum(row["total_tokens"] for row in tasks),
        "by_task": tasks,
        "first_call": entries[0]["ts"] if entries else None,
        "last_call": entries[-1]["ts"] if entries else None,
    }

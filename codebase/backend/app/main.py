from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import MODEL
from .core.llm import ask
from .core import usage as usage_ledger
from .routers import (
    quiz,
    explain,
    chat,
    graph,
    probes,
    diagnosis,
    plan,
    session,
    source,
    admin,
)

app = FastAPI(
    title="ColdBrew — Knowledge-to-Lesson API",
    description="Backend API cho đề C1 · Lesson Studio (Chẩn đoán lỗ hổng prerequisite & Lộ trình thích ứng)",
    version="0.1.0",
)

# CORS middleware hỗ trợ cả dev frontend Vite (cổng 5173) và client khác
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health endpoints
@app.get("/api/health", tags=["Health"])
@app.get("/api/v0/health", tags=["Health"])
def health():
    return {"ok": True, "model": MODEL, "version": "v0"}

@app.get("/api/v0/usage", tags=["Health"])
def usage_report(detail: bool = False):
    """Sổ token cho báo cáo: tổng và bóc theo tác vụ. detail=true trả từng lời gọi."""
    report = usage_ledger.summary()
    if detail:
        report["calls_detail"] = usage_ledger.read_all()
    return report

@app.get("/api/llm-check", tags=["Health"])
@app.get("/api/v0/llm-check", tags=["Health"])
def llm_check():
    return {"reply": ask("Trả lời đúng một từ: ok", task="llm_check")}

# ==================== BE 1 ROUTERS ====================
app.include_router(quiz.router, prefix="/api/v0")
app.include_router(explain.router, prefix="/api/v0")
app.include_router(chat.router, prefix="/api/v0")

# ==================== BE 2 ROUTERS ====================
app.include_router(graph.router, prefix="/api/v0")
app.include_router(probes.router, prefix="/api/v0")
app.include_router(diagnosis.router, prefix="/api/v0")
app.include_router(plan.router, prefix="/api/v0")
app.include_router(session.router, prefix="/api/v0")
app.include_router(source.router, prefix="/api/v0")
app.include_router(admin.router, prefix="/api/v0")

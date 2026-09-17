from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .llm import MODEL, ask

app = FastAPI(title="ColdBrew — Knowledge-to-Lesson API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"ok": True, "model": MODEL}


@app.get("/api/llm-check")
def llm_check():
    return {"reply": ask("Trả lời đúng một từ: ok")}

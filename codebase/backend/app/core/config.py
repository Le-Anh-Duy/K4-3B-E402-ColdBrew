from pathlib import Path
import os
from dotenv import load_dotenv

# Tìm file .env ở các cấp thư mục (repo root, codebase, backend)
current = Path(__file__).resolve()
possible_envs = [
    current.parents[4] / ".env",  # d:\...\K4-3B-E402-ColdBrew\.env (Repo root)
    current.parents[3] / ".env",  # codebase\.env
    current.parents[2] / ".env",  # codebase\backend\.env
    Path.cwd() / ".env",
]

for p in possible_envs:
    if p.exists():
        load_dotenv(p, override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
MODEL = os.getenv("MODEL", "gemini-3.5-flash-lite")
LLM_TIMEOUT_SEC = float(os.getenv("LLM_TIMEOUT_SEC", "45"))
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "1024"))
LLM_REASONING_EFFORT = os.getenv("LLM_REASONING_EFFORT", "minimal")

# Token quản trị cho trang admin (nạp transcript, xem sổ token).
# Không đặt thì mọi route /admin đều bị khoá — không có mặc định để đoán.
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "").strip()

SLOW_SEC = 25  # Ngưỡng đúng nhưng chậm (>25s)
RUSH_SEC = 3   # Ngưỡng sai quá nhanh (<3s: bấm bừa)
MAX_ROUNDS = 3 # Số vòng leo cây tối đa

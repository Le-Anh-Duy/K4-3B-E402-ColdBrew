import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.environ.get("GEMINI_API_KEY"),
    base_url=os.environ.get(
        "OPENAI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/"
    ),
    timeout=float(os.environ.get("LLM_TIMEOUT_SEC", "45")),
    max_retries=0,
)
MODEL = os.environ.get("MODEL", "gemini-3.5-flash-lite")


def ask(prompt: str) -> str:
    r = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=int(os.environ.get("LLM_MAX_TOKENS", "1024")),
        reasoning_effort=os.environ.get("LLM_REASONING_EFFORT", "minimal"),
    )
    return r.choices[0].message.content

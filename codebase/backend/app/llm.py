import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.environ.get("GEMINI_API_KEY"),
    base_url=os.environ.get(
        "OPENAI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/"
    ),
)
MODEL = os.environ.get("MODEL", "gemini-2.5-flash")


def ask(prompt: str) -> str:
    r = client.chat.completions.create(
        model=MODEL, messages=[{"role": "user", "content": prompt}]
    )
    return r.choices[0].message.content

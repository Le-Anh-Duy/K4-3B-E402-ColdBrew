from typing import List, Dict, Optional
import json
import os
import logging
import time
from openai import OpenAI

from . import usage
from .config import (
    LLM_MAX_TOKENS,
    LLM_REASONING_EFFORT,
    LLM_TIMEOUT_SEC,
    MODEL,
    OPENAI_BASE_URL,
)

logger = logging.getLogger("coldbrew.llm")

def get_api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()

def get_client() -> OpenAI:
    api_key = get_api_key()
    return OpenAI(
        api_key=api_key or "dummy_key",
        base_url=OPENAI_BASE_URL,
        timeout=LLM_TIMEOUT_SEC,
        max_retries=0,
    )

def ask(
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.3,
    json_mode: bool = False,
    task: str = "unknown",
    max_tokens: Optional[int] = None
) -> str:
    """
    Gọi Gemini qua OpenAI-compatible endpoint.
    Hỗ trợ system prompt và json format.
    `task` là nhãn để ghi sổ token theo từng nghiệp vụ (chat, plan, hypothesis...).
    """
    api_key = get_api_key()
    if not api_key:
        logger.warning("Chưa cấu hình GEMINI_API_KEY trong .env (hoặc chưa lưu file .env)")
        return ""

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    kwargs = {
        "model": MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens or LLM_MAX_TOKENS,
        "reasoning_effort": LLM_REASONING_EFFORT,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    started = time.monotonic()
    try:
        client = get_client()
        response = client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content or ""
        usage.record(task, MODEL, getattr(response, "usage", None), int((time.monotonic() - started) * 1000))
        return content.strip()
    except Exception as e:
        usage.record(task, MODEL, None, int((time.monotonic() - started) * 1000), ok=False, error=str(e))
        logger.error(f"Lỗi khi gọi Gemini LLM: {e}")
        raise e

def ask_json(
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.2,
    task: str = "unknown",
    max_tokens: Optional[int] = None
) -> Dict:
    """Gọi Gemini và parse kết quả dưới dạng JSON object."""
    raw = ask(prompt, system_prompt=system_prompt, temperature=temperature, json_mode=True, task=task, max_tokens=max_tokens)
    if not raw:
        raise ValueError("LLM trả về rỗng do chưa có GEMINI_API_KEY")
    try:
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        return json.loads(raw)
    except Exception as e:
        logger.error(f"Không thể parse JSON từ LLM output: {raw}. Lỗi: {e}")
        raise e

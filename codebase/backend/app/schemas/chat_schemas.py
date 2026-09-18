from ..core.usage import last as last_usage
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class WeakSignalIn(BaseModel):
    node: str
    label: Optional[str] = None
    flag: str
    sec: int

class ChatIn(BaseModel):
    target_node_id: str
    target_label: Optional[str] = None
    source_page: Optional[str] = None
    content_summary: Optional[str] = None
    weak_signals: List[WeakSignalIn]
    message: str
    history: List[ChatMessage] = Field(default_factory=list)

class ChatOut(BaseModel):
    reply: str
    grounded_node: str
    slide_page: str
    suggested_actions: List[str]
    # Token của chính lời gọi LLM vừa rồi — default_factory chạy lúc dựng object,
    # tức vẫn trong context của request đó, nên UI nhận đúng số của mình.
    usage: Optional[Dict[str, Any]] = Field(default_factory=last_usage)

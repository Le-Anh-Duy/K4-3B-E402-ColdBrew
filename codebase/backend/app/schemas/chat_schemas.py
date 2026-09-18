from typing import List, Optional, Dict
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

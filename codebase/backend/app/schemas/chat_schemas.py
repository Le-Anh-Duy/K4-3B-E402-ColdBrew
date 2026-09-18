from typing import List, Optional, Dict
from pydantic import BaseModel

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
    weak_signals: List[WeakSignalIn]
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatOut(BaseModel):
    reply: str
    grounded_node: str
    slide_page: str
    suggested_actions: List[str]

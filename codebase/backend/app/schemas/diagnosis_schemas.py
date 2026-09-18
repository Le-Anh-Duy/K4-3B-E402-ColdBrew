from ..core.usage import last as last_usage
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class SignalHit(BaseModel):
    node: str
    label: str
    flag: str
    sec: int

class DiagnosisHypothesisIn(BaseModel):
    target_node_id: str
    hits: List[SignalHit]
    only_slow: bool = False
    rushed_any: bool = False

class DiagnosisHypothesisOut(BaseModel):
    target_node_id: str
    target_label: str
    slide_page: str
    confidence: str  # "thấp" | "trung bình" | "cao"
    confidence_explanation: str
    hypothesis_text: str
    suggested_action: str
    # Token của chính lời gọi LLM vừa rồi — default_factory chạy lúc dựng object,
    # tức vẫn trong context của request đó, nên UI nhận đúng số của mình.
    usage: Optional[Dict[str, Any]] = Field(default_factory=last_usage)

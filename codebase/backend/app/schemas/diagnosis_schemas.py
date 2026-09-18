from typing import List, Optional, Dict, Any
from pydantic import BaseModel

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

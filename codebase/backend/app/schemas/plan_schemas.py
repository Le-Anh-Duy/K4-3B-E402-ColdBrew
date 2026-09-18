from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class TraceStep(BaseModel):
    t: str
    d: str

class PlanGenerateIn(BaseModel):
    verdict: str  # "located" | "restart" | "self" | "accepted"
    target_node_id: Optional[str] = None
    trace: List[TraceStep]

class RemediationItem(BaseModel):
    text: str
    slide_page: str

class PlanGenerateOut(BaseModel):
    title: str
    verdict: str
    target_node_id: Optional[str] = None
    items: List[RemediationItem]
    why_explanation: str
    compact_summary: Optional[List[str]] = None
    provenance_confirmed: bool = True

class SessionStateIn(BaseModel):
    stage: str
    records: Optional[List[Dict[str, Any]]] = []
    target: Optional[str] = None
    round: int = 0
    retry: int = 0
    hits: Optional[List[str]] = []
    round_recs: Optional[List[Dict[str, Any]]] = []
    decision: Optional[str] = None
    next_target: Optional[str] = None
    trace: Optional[List[TraceStep]] = []
    status: Optional[Dict[str, str]] = {}
    verdict: Optional[str] = None

class SessionOut(BaseModel):
    session_id: str
    state: Dict[str, Any]

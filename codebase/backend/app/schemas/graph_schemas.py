from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class TreeNode(BaseModel):
    id: str
    label: str
    page: str
    parent: Optional[str] = None
    compact: Optional[List[str]] = None
    content_summary: Optional[str] = None

class TreeResponse(BaseModel):
    nodes: Dict[str, TreeNode]

class ProbeQuestionOut(BaseModel):
    id: int
    q: str
    options: List[str]
    # Không trả về answer để bảo mật

class ProbesOut(BaseModel):
    target_node_id: str
    target_label: str
    slide_page: str
    questions: List[ProbeQuestionOut]

class EvaluateRoundIn(BaseModel):
    target_node_id: str
    round_num: int
    picked: List[Optional[int]]
    times: List[int]

class EvaluateRoundOut(BaseModel):
    decision: str  # locate | escalate | restart
    next_target: Optional[str] = None
    next_target_label: Optional[str] = None
    bad_count: int
    slow_count: int
    records: List[Dict[str, Any]]
    trace_entry: Dict[str, str]

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
    # node sâu nhất đã TRƯỢT ở các vòng trước — thiếu nó thì không xác định được
    # chỗ hổng khi vòng hiện tại trả lời đạt (xem docs/data-model.md §9)
    last_failed: Optional[str] = None

class EvaluateRoundOut(BaseModel):
    decision: str  # locate | escalate | restart
    next_target: Optional[str] = None
    next_target_label: Optional[str] = None
    bad_count: int
    slow_count: int
    records: List[Dict[str, Any]]
    trace_entry: Dict[str, str]
    # kết luận theo kịch bản: chỗ hổng là node SÂU NHẤT bị trượt, node đạt là TRẦN
    gap: Optional[str] = None
    gap_label: Optional[str] = None
    ceiling: Optional[str] = None
    ceiling_label: Optional[str] = None
    scenario: Optional[str] = None      # y_le | muc_nong | muc_duoi_tran | nen_bai | leo
    prompt_key: Optional[str] = None    # system prompt mà luật giao cho AI

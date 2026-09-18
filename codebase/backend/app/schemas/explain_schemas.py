from ..core.usage import last as last_usage
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ExplainSingleIn(BaseModel):
    node_id: str
    question: str
    options: List[str]
    correct_idx: int
    selected_idx: Optional[int] = None
    time_sec: int
    flag: str

class ExplainSingleOut(BaseModel):
    why: str
    trap: Optional[str] = None
    timing_note: Optional[str] = None
    slide_page: Optional[str] = None
    # Token của chính lời gọi LLM vừa rồi — default_factory chạy lúc dựng object,
    # tức vẫn trong context của request đó, nên UI nhận đúng số của mình.
    usage: Optional[Dict[str, Any]] = Field(default_factory=last_usage)

class RoundRecordIn(BaseModel):
    question: str
    options: List[str]
    correct_idx: int
    selected_idx: Optional[int] = None
    sec: int
    flag: str

class ExplainRoundIn(BaseModel):
    target_node_id: str
    round_num: int
    decision: str  # locate | escalate | restart
    records: List[RoundRecordIn]

class ExplainRoundOut(BaseModel):
    summary: str
    per_question_notes: List[str]
    advice: str
    # Token của chính lời gọi LLM vừa rồi — default_factory chạy lúc dựng object,
    # tức vẫn trong context của request đó, nên UI nhận đúng số của mình.
    usage: Optional[Dict[str, Any]] = Field(default_factory=last_usage)

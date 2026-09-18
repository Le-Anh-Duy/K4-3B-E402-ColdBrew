from typing import List, Optional, Dict
from pydantic import BaseModel

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

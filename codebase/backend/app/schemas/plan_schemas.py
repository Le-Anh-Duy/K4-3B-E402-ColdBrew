from ..core.usage import last as last_usage
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class TraceStep(BaseModel):
    t: str
    d: str

class PlanGenerateIn(BaseModel):
    verdict: str  # "located" | "restart" | "self" | "accepted"
    target_node_id: Optional[str] = None
    trace: List[TraceStep] = []
    # đường mới: luật đưa thẳng kịch bản + chỗ hổng + trần, AI chỉ viết chữ
    scenario: Optional[str] = None       # y_le | muc_nong | muc_duoi_tran | nen_bai
    gap_node_id: Optional[str] = None    # None = hổng ở chính ý trong quiz
    ceiling_node_id: Optional[str] = None
    records: Optional[List[Dict[str, Any]]] = None  # kết quả quiz, để nêu đúng ý bị sai

class RemediationItem(BaseModel):
    text: str
    slide_page: str = ""   # giữ tên cũ cho frontend; nay chứa nguồn dạng "file · [T01-xxx]"

class PlanGenerateOut(BaseModel):
    title: str
    verdict: str
    target_node_id: Optional[str] = None
    items: List[RemediationItem]
    why_explanation: str
    compact_summary: Optional[List[str]] = None
    provenance_confirmed: bool = True
    scenario: Optional[str] = None
    prompt_key: Optional[str] = None
    advice_text: Optional[str] = None      # nguyên văn AI viết, dùng cho bộ đo
    allowed_spans: Optional[List[str]] = None  # mã đoạn ĐÃ CẤP cho prompt — bộ đo chấm theo đây
    # Token của chính lời gọi LLM vừa rồi — default_factory chạy lúc dựng object,
    # tức vẫn trong context của request đó, nên UI nhận đúng số của mình.
    usage: Optional[Dict[str, Any]] = Field(default_factory=last_usage)

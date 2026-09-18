from typing import List, Optional
from pydantic import BaseModel, Field

class FeedbackIn(BaseModel):
    session_id: Optional[str] = Field(default=None, description="ID phiên học nếu có")
    stars: int = Field(..., ge=1, le=5, description="Đánh giá từ 1 đến 5 sao")
    reasons: Optional[List[str]] = Field(default=[], description="Danh sách lý do chọn nhanh (tag chip)")
    comment: Optional[str] = Field(default="", description="Ý kiến/nhận xét đóng góp chi tiết")
    node_id: Optional[str] = Field(default=None, description="Mã node kiến thức đang xét")
    topic: Optional[str] = Field(default=None, description="Tên chủ đề hoặc slide của phiên quiz")

class FeedbackOut(BaseModel):
    ok: bool = True
    id: str = Field(..., description="ID định danh của bản ghi nhận xét")
    session_id: Optional[str] = None
    stars: int
    reasons: List[str] = []
    comment: Optional[str] = ""
    node_id: Optional[str] = None
    topic: Optional[str] = None
    created_at: str
    message: str = "Đã lưu nhận xét thành công"

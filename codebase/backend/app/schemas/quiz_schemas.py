from typing import List, Optional
from pydantic import BaseModel

class QuizQuestionOut(BaseModel):
    id: str
    node: str
    q: str
    options: List[str]

class QuizGradeIn(BaseModel):
    question_ids: Optional[List[str]] = None
    picked: List[Optional[int]]
    times: List[int]

class QuestionRecord(BaseModel):
    node: str
    sel: Optional[int]
    correct: bool
    sec: int
    flag: str  # ok | slow | wrong | rush | skip
    answer: int  # Đáp án đúng của câu hỏi
    why: Optional[str] = None  # Giải thích vì sao đúng
    trap: Optional[str] = None  # Bẫy của phương án đã chọn

class QuizGradeOut(BaseModel):
    records: List[QuestionRecord]
    correct_count: int
    total_count: int
    total_sec: int

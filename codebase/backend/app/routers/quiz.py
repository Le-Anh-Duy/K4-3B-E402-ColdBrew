from typing import List
from pathlib import Path
import json
from fastapi import APIRouter, HTTPException

from ..schemas.quiz_schemas import QuizQuestionOut, QuizGradeIn, QuizGradeOut, QuestionRecord
from ..core import engine

router = APIRouter(prefix="/quiz", tags=["BE1 - Quiz & Assessment"])

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "quiz.json"

def load_quiz_data():
    if not DATA_PATH.exists():
        raise HTTPException(status_code=500, detail="Không tìm thấy file quiz.json")
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("", response_model=List[QuizQuestionOut])
def get_quiz():
    """Lấy danh sách câu hỏi quiz ôn tập. Đáp án đúng được ẩn phía server trong lúc làm bài."""
    quiz_items = load_quiz_data()
    return [
        QuizQuestionOut(
            id=q.get("id", f"q{i}"),
            node=q["node"],
            q=q["q"],
            options=q["options"]
        )
        for i, q in enumerate(quiz_items)
    ]

@router.post("/grade", response_model=QuizGradeOut)
def grade_quiz(body: QuizGradeIn):
    """
    Chấm điểm quiz kết hợp thời gian làm bài:
    - Gắn nhãn: ok, slow (>25s), wrong, rush (<3s), skip.
    - Trả về đáp án đúng, giải thích why và bẫy trap cho từng câu.
    """
    quiz_items = load_quiz_data()
    records_raw = engine.grade(quiz_items, body.picked, body.times)
    records = []

    for i, r in enumerate(records_raw):
        q = quiz_items[i]
        sel = r.get("sel")
        trap = None
        if sel is not None and not r.get("correct"):
            trap = (q.get("traps") or {}).get(str(sel))

        records.append(QuestionRecord(
            node=r["node"],
            sel=r["sel"],
            correct=r["correct"],
            sec=r["sec"],
            flag=r["flag"],
            answer=q["answer"],
            why=q.get("why"),
            trap=trap
        ))

    correct_count = sum(1 for r in records if r.correct)
    total_sec = sum(r.sec for r in records)

    return QuizGradeOut(
        records=records,
        correct_count=correct_count,
        total_count=len(records),
        total_sec=total_sec
    )

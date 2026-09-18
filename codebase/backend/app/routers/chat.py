from pathlib import Path
import json
from fastapi import APIRouter
from ..schemas.chat_schemas import ChatIn, ChatOut
from ..prompts.chat_prompts import CHAT_SYSTEM_PROMPT
from ..core import llm

router = APIRouter(prefix="/ai/chat", tags=["BE1 - Chatbot Phản Biện"])

DATA_TREE_PATH = Path(__file__).resolve().parent.parent / "data" / "tree.json"

def get_tree():
    with open(DATA_TREE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@router.post("/message", response_model=ChatOut)
def chat_message(body: ChatIn):
    """
    Chatbot giải đáp thắc mắc khi học viên thấy chẩn đoán chưa thuyết phục:
    - Trả lời vì sao hệ thống nghi ngờ mục này
    - Xử lý nếu học viên bảo 'đọc nhầm đề / bấm nhầm'
    - Ràng buộc 100% vào Slide và Cây tri thức.
    """
    tree = get_tree()
    node_info = tree.get(body.target_node_id, {})
    node_label = node_info.get("label") or body.target_label or body.target_node_id
    slide_page = node_info.get("page") or body.source_page or "(chưa có mã đoạn nguồn)"
    summary = node_info.get("content_summary") or body.content_summary or ""

    signals_desc = [
        f"- Concept '{s.label or s.node}': cờ {s.flag}, làm trong {s.sec}s"
        for s in body.weak_signals
    ]

    history_desc = ""
    if body.history:
        history_desc = "\nLịch sử chat gần nhất:\n" + "\n".join(
            f"{m.role}: {m.content}" for m in body.history[-4:]
        )

    prompt = f"""
Mục tiêu chẩn đoán hiện tại: {node_label} (Nguồn: {slide_page})
Tóm tắt kiến thức của mục: {summary}
Các tín hiệu yếu mà học viên mắc phải:
{chr(10).join(signals_desc)}
{history_desc}

Câu hỏi của học viên: "{body.message}"
"""

    try:
        res = llm.ask_json(prompt, system_prompt=CHAT_SYSTEM_PROMPT, temperature=0.3)
        return ChatOut(
            reply=res.get("reply", f"Hệ thống nghi ngờ mục '{node_label}' dựa trên các tín hiệu yếu của bạn. Nguồn tham khảo: {slide_page}."),
            grounded_node=node_label,
            slide_page=slide_page,
            suggested_actions=res.get("suggested_actions", [
                "Kiểm tra 3 câu nền",
                "Xem lại đoạn transcript nguồn",
                "Làm lại bài quiz"
            ])
        )
    except Exception:
        # Fallback có logic tương thích với mockup/flow.md
        q_lower = body.message.lower()
        if any(k in q_lower for k in ["vì sao", "tại sao", "căn cứ", "sao lại"]):
            reply = f"Vì {len(body.weak_signals)} tín hiệu yếu của bạn đều thuộc phạm vi của '{node_label}'. Các phần khác bạn làm tốt nên hệ thống không khoanh vùng vào đó. Nguồn: {slide_page}."
        elif any(k in q_lower for k in ["đọc nhầm", "bấm nhầm", "nhầm", "oan"]):
            reply = f"Mình hiểu bạn có thể bị bấm nhầm hoặc đọc vội. Hệ thống chỉ chấm dựa trên tín hiệu thu được — nếu vậy bạn có thể kiểm tra 3 câu nền để loại trừ cho chắc, hoặc bấm làm lại bài quiz."
        elif any(k in q_lower for k in ["là gì", "định nghĩa", "khái niệm"]):
            reply = f"{node_label}: {summary if summary else 'Vui lòng xem chi tiết tại'} Nguồn: {slide_page}."
        else:
            reply = f"Mọi suy luận của hệ thống đều dựa trên nội dung mục '{node_label}' ({slide_page}). Bạn có thể trả lời 3 câu nền để xác thực lại."

        return ChatOut(
            reply=reply,
            grounded_node=node_label,
            slide_page=slide_page,
            suggested_actions=[
                "Kiểm tra 3 câu nền",
                "Xem lại đoạn transcript nguồn",
                "Làm lại bài quiz"
            ]
        )

from pathlib import Path
import json
from fastapi import APIRouter
from ..schemas.diagnosis_schemas import DiagnosisHypothesisIn, DiagnosisHypothesisOut
from ..prompts.diagnosis_prompts import DIAGNOSIS_HYPOTHESIS_SYSTEM
from ..core import llm

router = APIRouter(prefix="/ai/diagnosis", tags=["BE2 - AI Chẩn Đoán Giả Thuyết"])

DATA_TREE_PATH = Path(__file__).resolve().parent.parent / "data" / "tree.json"

def get_tree():
    with open(DATA_TREE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@router.post("/hypothesis", response_model=DiagnosisHypothesisOut)
def generate_hypothesis(body: DiagnosisHypothesisIn):
    """
    AI #2: Diễn giải giả thuyết chẩn đoán lỗ hổng cho màn Analysis:
    - Trình bày rõ ràng căn cứ từ các tín hiệu yếu
    - Nêu rõ mức độ chắc chắn theo chuẩn HAX G2/G11.
    """
    tree = get_tree()
    node_info = tree.get(body.target_node_id, {})
    node_label = node_info.get("label", body.target_node_id)
    slide_page = node_info.get("page", "(chưa có mã đoạn nguồn)")

    hits_desc = [
        f"- {h.label} (cờ: {h.flag}, thời gian: {h.sec}s)"
        for h in body.hits
    ]

    confidence = "thấp" if body.only_slow else ("trung bình" if (body.rushed_any or len(body.hits) >= 2) else "thấp")

    prompt = f"""
Node mục tiêu được khoanh vùng: {node_label} ({slide_page})
Đánh giá độ chắc chắn ban đầu: {confidence}
Chỉ có câu chậm, không sai: {body.only_slow}
Có câu làm rất nhanh (rush): {body.rushed_any}
Các tín hiệu yếu thu được từ quiz:
{chr(10).join(hits_desc)}
"""

    try:
        res = llm.ask_json(prompt, system_prompt=DIAGNOSIS_HYPOTHESIS_SYSTEM, temperature=0.3, task="hypothesis")
        return DiagnosisHypothesisOut(
            target_node_id=body.target_node_id,
            target_label=node_label,
            slide_page=slide_page,
            confidence=confidence,
            confidence_explanation=res.get("confidence_explanation", f"Mức chắc chắn {confidence} dựa trên số lượng tín hiệu yếu thu được."),
            hypothesis_text=res.get("hypothesis_text", f"{len(body.hits)} tín hiệu này đều nằm dưới {node_label}. Nhiều khả năng chỗ hổng là ở mục này hoặc phần nền phía trên."),
            suggested_action=res.get("suggested_action", "Kiểm tra 3 câu nền để xác thực.")
        )
    except Exception:
        # Fallback
        if body.only_slow:
            conf_exp = "Mức chắc chắn thấp — bạn không sai câu nào, giả thuyết chỉ dựa trên thời gian trả lời chậm."
        elif body.rushed_any:
            conf_exp = "Mức chắc chắn trung bình — có câu bạn bấm rất nhanh (<3s), có thể do bấm vội chứ không hẳn là không biết."
        else:
            conf_exp = f"Mức chắc chắn {confidence} — dựa trên các câu trả lời sai, cần kiểm tra thêm ở tầng nền."

        return DiagnosisHypothesisOut(
            target_node_id=body.target_node_id,
            target_label=node_label,
            slide_page=slide_page,
            confidence=confidence,
            confidence_explanation=conf_exp,
            hypothesis_text=f"{len(body.hits)} tín hiệu yếu đều nằm dưới mục {node_label}. Nhiều khả năng chỗ hổng là ở mục này hoặc kiến thức nền phía trên nó.",
            suggested_action="Kiểm tra 3 câu nền của mục này để xác nhận."
        )

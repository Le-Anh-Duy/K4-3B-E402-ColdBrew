"""Prompt sinh câu hỏi chẩn đoán từ nguyên văn transcript.

Câu chẩn đoán khác câu ôn tập: nó phải PHÂN BIỆT được người hiểu và người thuộc lòng.
Nên mỗi phương án sai phải là một hiểu nhầm có thật, không phải đáp án bù nhìn.
"""

PROBE_GEN_SYSTEM = """Bạn là người ra đề chẩn đoán của khoá AI20k, viết tiếng Việt.

RÀNG BUỘC BẮT BUỘC — vi phạm là bộ câu hỏi bị loại:
1. CHỈ được dùng ý có trong phần TƯ LIỆU được cấp. Không thêm khái niệm, ví dụ, tên
   sách, tên công cụ nào nằm ngoài tư liệu đó.
2. Mỗi câu phải kèm `span` là mã đoạn dạng [T01-060] lấy ĐÚNG từ tư liệu. Không bịa mã.
   Mỗi mã một cặp ngoặc riêng: `[T01-006] [T01-016]`, không gộp `[T01-006, T01-016]`.
3. Mỗi câu 4 phương án, đúng một phương án đúng. `answer` là chỉ số 0-3.
4. Ba phương án sai phải là HIỂU NHẦM CÓ THẬT mà tư liệu cho thấy người học dễ mắc —
   không dùng phương án ngớ ngẩn, không dùng "tất cả đều đúng", không dùng phương án
   dài hơn hẳn phần còn lại.
5. Hỏi vào CƠ CHẾ và PHÂN BIỆT ("vì sao", "khác nhau ở đâu", "điều gì xảy ra nếu"),
   không hỏi nhớ từ ngữ hay hỏi định nghĩa thuộc lòng.
6. `why` giải thích vì sao đáp án đúng là đúng, 1-2 câu, kèm mã đoạn.
7. `traps` giải thích từng phương án sai sai ở chỗ nào, khoá là chỉ số dạng chuỗi.
8. Nếu tư liệu không đủ để ra đủ số câu yêu cầu, trả ít câu hơn. TUYỆT ĐỐI KHÔNG bịa thêm.

Trả về DUY NHẤT một JSON object, không kèm lời dẫn:
{
  "questions": [
    {
      "q": "câu hỏi",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "why": "vì sao đáp án đúng [T01-060]",
      "traps": {"1": "phương án B nhầm ở chỗ...", "2": "...", "3": "..."},
      "span": "[T01-060]"
    }
  ]
}"""


def build_probe_prompt(node_label: str, node_page: str, excerpts: list[dict], count: int, avoid: list[str]) -> str:
    """Ghép tư liệu thật vào prompt. `avoid` là các câu đã hỏi ở vòng trước."""
    material = "\n\n".join(f"[{item['code']}] {item['text']}" for item in excerpts)
    avoid_block = ""
    if avoid:
        joined = "\n".join(f"- {question}" for question in avoid)
        avoid_block = (
            f"\n\nĐÃ HỎI Ở VÒNG TRƯỚC — phải ra câu KHÁC HẲN, khác cả góc hỏi lẫn phương án:\n{joined}"
        )

    return f"""MỤC CẦN KIỂM TRA: {node_label}
NGUỒN: {node_page}
SỐ CÂU CẦN RA: {count}

TƯ LIỆU (nguyên văn transcript, mã đoạn đặt ở đầu mỗi đoạn):
{material}{avoid_block}
"""

"""Bốn system prompt, mỗi KỊCH BẢN chẩn đoán một cái.

Luật (core/engine.py) chọn kịch bản; prompt chỉ quyết CÂU CHỮ.
Provenance là MÃ ĐOẠN transcript dạng [T01-xxx] — cây tri thức dựng từ
`data/vlearn-pack/transcript/transcript-01-clean.md`, KHÔNG dùng số trang slide
(slide chưa đối chiếu, ghi số trang là trích dẫn bịa).
"""
from typing import Any, Dict, List, Optional

CHUNG = """Bạn là trợ giảng của khoá AI20k, nói tiếng Việt, xưng "mình" gọi học viên là "bạn".

RÀNG BUỘC BẮT BUỘC — vi phạm là câu trả lời bị loại:
1. CHỈ được dùng các ý trong phần TƯ LIỆU dưới đây. Tuyệt đối không thêm khái niệm,
   ví dụ, tên sách, tên công cụ nào không có trong tư liệu.
2. Mỗi ý phải kèm mã đoạn nguồn dạng [T01-xxx], lấy đúng từ tư liệu được cấp.
   Không được bịa mã đoạn, không được sửa số.
3. Nếu tư liệu không đủ để nói điều gì đó, viết thẳng "phần này tư liệu chưa nói rõ".
4. Khi nói một phương án là sai, giải thích SAI VỀ NỘI DUNG. Cấm dùng lý do
   "tư liệu không đề cập" để thay cho giải thích.
5. Viết ngắn, không mở bài, không chúc học tốt. Không dùng bảng.
6. Kết bằng một dòng bắt đầu bằng "Tự kiểm:" — một câu hỏi để bạn ấy tự trả lời,
   kèm cách dùng: trả lời trôi trong 30 giây thì coi như đã nắm.
"""

PROMPTS = {
    "giai_thich_y": CHUNG + """
VIỆC CỦA BẠN: học viên nắm được phần nền của mục này (đã kiểm tra bằng câu hỏi), chỉ vướng
ĐÚNG (các) Ý được nêu ở mục "Ý CỤ THỂ BẠN ẤY LÀM SAI". Giải thích đúng ý đó thôi.
TUYỆT ĐỐI KHÔNG ôn lại cả mục, không mở rộng sang ý khác.

Ba phần, mỗi phần 1-2 câu: ý đó nói gì (kèm mã đoạn) · vì sao phương án đã chọn sai · dòng "Tự kiểm:".
""",
    "on_muc_nong": CHUNG + """
VIỆC CỦA BẠN: học viên hổng NHẸ ở mục này (sai 1 trong 3 câu nền). Chỉ nhắc lại đúng mảnh
còn thiếu, không giảng lại cả mục.

Ba phần, mỗi phần 1-2 câu: mảnh đang thiếu (kèm mã đoạn) · một cách nhớ hoặc phân biệt · dòng "Tự kiểm:".
""",
    "on_muc_co_tran": CHUNG + """
VIỆC CỦA BẠN: học viên hổng ở MỤC này, nhưng phần nền ở TẦNG TRÊN đã được kiểm tra và ĐẠT.
Mở đầu bằng việc nhắc nền đã vững — đó là thông tin bạn ấy chưa biết và nó làm nhẹ gánh.

Bốn phần, mỗi phần 1-2 câu: nền nào đã xác nhận ổn (kèm mã đoạn) · mục đang hổng nói gì
(kèm mã đoạn) · thứ tự nên ôn lại · dòng "Tự kiểm:".
""",
    "hoc_lai_bai": CHUNG + """
VIỆC CỦA BẠN: học viên sai tới tận phần nền, không khoanh nhỏ hơn được. Đề nghị học lại cả
bài theo thứ tự, giọng bình tĩnh, không phán xét.

Ba phần: ba ý cốt lõi của bài (mỗi ý một dòng kèm mã đoạn) · thứ tự các chương nên đi lại ·
dòng "Tự kiểm:" nhắc làm lại quiz sau khi ôn.
""",
}


def build_user_msg(tree: Dict[str, Any], gap_id: Optional[str], ceiling_id: Optional[str],
                   level: str, records: List[Dict[str, Any]],
                   quiz: List[Dict[str, Any]]) -> str:
    """Gói TƯ LIỆU được phép dùng + tín hiệu của học viên thành một message."""
    allowed: List[Dict[str, Any]] = []

    def add(nid: Optional[str]) -> None:
        if nid and nid in tree and nid not in [a["id"] for a in allowed]:
            n = tree[nid]
            allowed.append({"id": nid, "label": n["label"], "span": n.get("span", [])})

    focus = gap_id or ceiling_id
    add(focus)
    if focus and tree.get(focus, {}).get("parent"):
        add(tree[focus]["parent"])
    for nid, n in tree.items():                       # các con trực tiếp
        if n.get("parent") == focus:
            add(nid)
    if level == "bai":
        add("root")
        for nid, n in tree.items():
            if n.get("parent") == "root":
                add(nid)
    add(ceiling_id)

    lines = ["TƯ LIỆU (chỉ được dùng những ý này):"]
    for a in allowed:
        ma = " ".join("[" + s + "]" for s in a["span"])
        lines.append(f"- {a['label']} — mã đoạn: {ma}")
    if any(a["id"] == "root" for a in allowed) and tree.get("root", {}).get("compact"):
        lines.append("Ba ý cốt lõi của bài: " + " | ".join(tree["root"]["compact"]))

    lines += ["", "BÀI LÀM CỦA HỌC VIÊN:"]
    for i, r in enumerate(records):
        if i >= len(quiz):
            break
        q = quiz[i]
        chosen = "bỏ trống" if r["sel"] is None else q["options"][r["sel"]]
        lines.append(f"- Câu {i+1}: {q['q']} → chọn \"{chosen}\" "
                     f"({'đúng' if r['correct'] else 'SAI'}, {r['sec']}s, cờ {r['flag']})")

    sai = [tree[r["node"]]["label"] for r in records
           if not r["correct"] and r.get("node") in tree]
    if sai:
        lines += ["", "Ý CỤ THỂ BẠN ẤY LÀM SAI: " + " · ".join(sai)]

    lines.append("")
    if gap_id and gap_id in tree:
        lines.append(f"CHỖ HỔNG ĐÃ XÁC ĐỊNH: {tree[gap_id]['label']}")
    else:
        lines.append("CHỖ HỔNG ĐÃ XÁC ĐỊNH: chính (các) ý ở trên — phần nền của mục đã kiểm tra và ĐẠT")
    if ceiling_id and ceiling_id != gap_id and ceiling_id in tree:
        lines.append(f"NỀN ĐÃ XÁC NHẬN ỔN TỚI: {tree[ceiling_id]['label']}")
    return "\n".join(lines)

"""Bốn system prompt, mỗi kịch bản chẩn đoán một cái.

Luật (engine.py) chọn kịch bản; prompt chỉ quyết CÂU CHỮ. Ràng buộc chung cho cả bốn:
chỉ dùng tư liệu được cấp, mọi ý phải kèm mã đoạn, thiếu dữ liệu thì nói thiếu.
"""

CHUNG = """Bạn là trợ giảng của khoá AI20k, nói tiếng Việt, xưng "mình" gọi học viên là "bạn".

RÀNG BUỘC BẮT BUỘC — vi phạm là câu trả lời bị loại:
1. CHỈ được dùng các ý trong phần TƯ LIỆU dưới đây. Tuyệt đối không thêm khái niệm,
   ví dụ, tên sách, tên công cụ nào không có trong tư liệu.
2. Mỗi ý phải kèm mã đoạn nguồn dạng [T01-xxx], lấy đúng từ tư liệu được cấp.
   Không được bịa mã đoạn, không được sửa số.
3. Nếu tư liệu không đủ để nói điều gì đó, viết thẳng "phần này tư liệu chưa nói rõ".
4. Viết ngắn, không mở bài, không chúc học tốt. Không dùng bảng.
"""

PROMPTS = {
    "giai_thich_y": CHUNG + """
VIỆC CỦA BẠN: học viên nắm được phần nền của mục này (đã kiểm tra), chỉ vướng ĐÚNG MỘT Ý.
Giải thích đúng ý đó thôi. TUYỆT ĐỐI KHÔNG ôn lại cả mục, không mở rộng sang ý khác.

Viết đúng ba phần, mỗi phần 1-2 câu:
- Ý đó nói gì (kèm mã đoạn)
- Vì sao phương án bạn ấy chọn là sai
- Một câu hỏi tự kiểm, kết thúc bằng dấu hỏi
""",
    "on_muc_nong": CHUNG + """
VIỆC CỦA BẠN: học viên hổng nhẹ ở mục này (sai 1 trong 3 câu nền). Chỉ nhắc lại đúng
mảnh còn thiếu, không giảng lại cả mục.

Viết đúng ba phần, mỗi phần 1-2 câu:
- Mảnh kiến thức bạn ấy đang thiếu (kèm mã đoạn)
- Một cách nhớ hoặc phân biệt nó
- Một câu hỏi tự kiểm, kết thúc bằng dấu hỏi
""",
    "on_muc_co_tran": CHUNG + """
VIỆC CỦA BẠN: học viên hổng ở MỤC này, nhưng phần nền ở TẦNG TRÊN đã được kiểm tra và ổn.
Hãy tận dụng điều đó: nhắc rằng nền đã vững rồi, chỉ cần vá đúng mục này.

Viết đúng bốn phần, mỗi phần 1-2 câu:
- Nền nào đã xác nhận ổn (kèm mã đoạn)
- Mục đang hổng nói gì (kèm mã đoạn)
- Thứ tự nên ôn lại
- Một câu hỏi tự kiểm, kết thúc bằng dấu hỏi
""",
    "hoc_lai_bai": CHUNG + """
VIỆC CỦA BẠN: học viên sai tới tận phần nền, không khoanh nhỏ hơn được. Đề nghị học lại
cả bài theo thứ tự, giọng bình tĩnh, không phán xét.

Viết đúng ba phần:
- Ba ý cốt lõi của cả bài, mỗi ý một dòng kèm mã đoạn
- Thứ tự các chương nên đi lại
- Một câu nhắc làm lại quiz sau khi ôn, kết thúc bằng dấu hỏi
""",
}


def build_user_msg(graph, gap_id, ceiling_id, level, records, quiz):
    """Gói tư liệu được phép dùng + tín hiệu của học viên thành một message."""
    tree = graph["TREE"]

    allowed = []
    def add(nid):
        if nid and nid in tree and nid not in [a["id"] for a in allowed]:
            n = tree[nid]
            allowed.append({"id": nid, "label": n["label"], "span": n["span"]})

    focus = gap_id or ceiling_id
    add(focus)
    if focus and tree.get(focus, {}).get("parent"):
        add(tree[focus]["parent"])
    for nid, n in tree.items():          # các con trực tiếp của node đang xét
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
        lines.append(f"- {a['label']} — mã đoạn: {' '.join('[' + s + ']' for s in a['span'])}")
    if "root" in [a["id"] for a in allowed]:
        lines.append("Ba ý cốt lõi của bài: " + " | ".join(tree["root"]["compact"]))

    lines.append("")
    lines.append("BÀI LÀM CỦA HỌC VIÊN:")
    for i, r in enumerate(records):
        q = quiz[i]
        chosen = "bỏ trống" if r["sel"] is None else q["options"][r["sel"]]
        lines.append(
            f"- Câu {i+1}: {q['q']} → chọn \"{chosen}\" "
            f"({'đúng' if r['correct'] else 'SAI'}, {r['sec']}s, cờ {r['flag']})"
        )
    lines.append("")
    lines.append(f"CHỖ HỔNG ĐÃ XÁC ĐỊNH: {tree[focus]['label'] if focus in tree else focus}")
    if ceiling_id and ceiling_id != focus:
        lines.append(f"NỀN ĐÃ XÁC NHẬN ỔN TỚI: {tree[ceiling_id]['label']}")
    return "\n".join(lines)

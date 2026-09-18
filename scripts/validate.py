"""Kiểm câu trả lời AI NGAY khi vừa sinh ra — đếm trích dẫn và soi đúng khung.

Bộ kiểm ĐỘC LẬP, nằm NGOÀI service: backend lo sinh nội dung, soi nội dung là việc của
bộ đo. Chạy tại chỗ, không cần LLM thứ hai, không tốn thêm lời gọi nào.

Dùng ở hai chỗ:
  · scripts/grounding.py — chấm cả lượt chạy
  · python scripts/validate.py "<câu trả lời>" [kịch bản] — soi nhanh MỘT câu trả lời

Bốn thứ đếm được bằng máy:
  1. Trích dẫn: đếm mã đoạn, tách ra hợp lệ / bịa (không có trong cây) / lạc (có trong
     cây nhưng không nằm trong tư liệu đã cấp cho prompt).
  2. Đủ số trích tối thiểu theo kịch bản.
  3. Đúng khung: có dòng "Tự kiểm:", đủ số ý, không lặp dòng Tự kiểm.
  4. Độ dài: quá ngắn (rỗng ruột) hay quá dài (lan man).
"""
import re
from typing import Any, Dict, Iterable, Optional

SPAN_RE = re.compile(r"\[(T\d{2}-\d{3})\]")
TU_KIEM_RE = re.compile(r"^\s*Tự kiểm\s*:", re.MULTILINE)

# số mã đoạn tối thiểu mà mỗi kịch bản phải trích
MIN_TRICH = {"y_le": 1, "muc_nong": 1, "muc_duoi_tran": 2, "nen_bai": 3}
MIN_TU, MAX_TU = 25, 320  # ngắn hơn là rỗng ruột, dài hơn là lan man


def check_response(text: str, allowed_spans: Optional[Iterable[str]] = None,
                   all_spans: Optional[Iterable[str]] = None,
                   scenario: Optional[str] = None) -> Dict[str, Any]:
    text = (text or "").strip()
    allowed = set(allowed_spans or [])
    known = set(all_spans or []) or allowed

    cited = SPAN_RE.findall(text)
    uniq = sorted(set(cited))
    bia = [s for s in uniq if known and s not in known]
    lac = [s for s in uniq if s in known and allowed and s not in allowed]
    hop_le = [s for s in uniq if s not in bia and s not in lac]

    so_tu = len(text.split())
    so_tu_kiem = len(TU_KIEM_RE.findall(text))
    can_it_nhat = MIN_TRICH.get(scenario or "", 1)

    thieu = []
    if not text:
        thieu.append("câu trả lời rỗng")
    if not cited:
        thieu.append("không có trích dẫn nào")
    elif len(uniq) < can_it_nhat:
        thieu.append(f"chỉ trích {len(uniq)} mã đoạn, kịch bản này cần ≥{can_it_nhat}")
    if bia:
        thieu.append(f"trích mã đoạn KHÔNG có trong cây: {', '.join(bia)}")
    if lac:
        thieu.append(f"trích ngoài tư liệu đã cấp: {', '.join(lac)}")
    if so_tu_kiem == 0:
        thieu.append('thiếu dòng bắt đầu bằng "Tự kiểm:"')
    elif so_tu_kiem > 1:
        thieu.append(f'có {so_tu_kiem} dòng "Tự kiểm:" — khung yêu cầu đúng một')
    if text and so_tu < MIN_TU:
        thieu.append(f"quá ngắn ({so_tu} từ)")
    if so_tu > MAX_TU:
        thieu.append(f"quá dài ({so_tu} từ)")

    return {
        "dat": not thieu,
        "thieu": thieu,
        "so_trich_dan": len(cited),
        "so_ma_doan_khac_nhau": len(uniq),
        "ma_doan_hop_le": hop_le,
        "ma_doan_bia": bia,
        "ma_doan_lac": lac,
        "co_tu_kiem": so_tu_kiem == 1,
        "so_dong_tu_kiem": so_tu_kiem,
        "so_tu": so_tu,
        "can_it_nhat": can_it_nhat,
    }


if __name__ == "__main__":
    import json
    import os
    import sys

    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    graph = json.load(open(os.path.join(root, "eval", "graph.json"), encoding="utf-8"))
    all_spans = sorted({s for n in graph["TREE"].values() for s in n.get("span", [])})
    kb = sys.argv[2] if len(sys.argv) > 2 else None
    bb = check_response(sys.argv[1], allowed_spans=all_spans, all_spans=all_spans, scenario=kb)
    print(json.dumps(bb, ensure_ascii=False, indent=2))
    sys.exit(0 if bb["dat"] else 1)

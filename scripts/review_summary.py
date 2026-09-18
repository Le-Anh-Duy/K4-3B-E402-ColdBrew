"""Gộp các bản chấm tay của cả nhóm và đo mức đồng thuận.

    python scripts/review_summary.py

Đọc eval/review/<tên>.json (mỗi người một file, sinh từ scripts/review_ui.py),
in số tổng hợp và ghi eval/human_review.md.

Theo hướng dẫn §2.6 của đề: hai người chấm độc lập mà LỆCH >20% số case thì
định nghĩa "đạt" của nhóm còn mơ hồ — phải sửa định nghĩa, không phải sửa sản phẩm.
"""
import json
import os
import sys
from itertools import combinations

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "eval", "review")
_g = json.load(open(os.path.join(ROOT, "eval", "grounding.json"), encoding="utf-8"))
ROWS = _g["rows"]
RUN_ID = _g.get("run_id", "?")
HASH = {r["id"]: r.get("hash") for r in ROWS}
CAU = [("nhan_xet", "① nhận xét AI ổn"), ("nhanh", "② chọn đúng chỗ hổng"),
       ("noi_vong", "③ không mâu thuẫn vòng trước")]

files = sorted(f for f in os.listdir(DIR) if f.endswith(".json")) if os.path.isdir(DIR) else []
if not files:
    sys.exit("Chưa ai chấm. Chạy: python scripts/review_ui.py")

raters, lac_hau = {}, {}
for f in files:
    d = json.load(open(os.path.join(DIR, f), encoding="utf-8"))
    ten = d.get("rater", f[:-5])
    cham = d.get("cham", {})
    # chỉ giữ bản chấm gắn đúng câu trả lời hiện tại; còn lại là chấm cho bản cũ
    hop_le = {cid: v for cid, v in cham.items() if v.get("hash") == HASH.get(cid)}
    cu = [cid for cid in cham if cid not in hop_le]
    raters[ten] = hop_le
    if cu:
        lac_hau[ten] = cu

print("")
print(f"Lượt chạy đang chấm: {RUN_ID} · {len(raters)} người chấm: {chr(44).join(raters)}")
for _ten, _cu in lac_hau.items():
    print(f"  CANH BAO {_ten}: {len(_cu)} ban cham cho CAU TRA LOI CU, khong tinh ({chr(44).join(_cu)})")
print("")
md = ["# Kết quả chấm tay", "", f"Lượt chạy: `{RUN_ID}` · {len(raters)} người chấm: {chr(44).join(raters)}", ""]
for _ten, _cu in lac_hau.items():
    md.append(f"> ⚠ **{_ten}** có {len(_cu)} bản chấm cho câu trả lời CŨ — không tính vào bảng dưới.")
md.append("")

for key, ten in CAU:
    md += [f"## {ten}", "", "| Người chấm | Đã chấm | Ổn | Tỉ lệ |", "|---|---|---|---|"]
    print(ten)
    for r, cham in raters.items():
        done = [c for c in cham.values() if c.get(key)]
        ok = [c for c in done if c[key] == "ok"]
        pct = f"{len(ok)/len(done)*100:.0f}%" if done else "—"
        print(f"  {r:<14} {len(ok)}/{len(done)}  ({pct})")
        md.append(f"| {r} | {len(done)}/{len(ROWS)} | {len(ok)} | {pct} |")
    md.append("")

# mức đồng thuận giữa từng cặp người chấm
print("\nĐồng thuận giữa các cặp (chỉ tính case cả hai cùng chấm):")
md += ["## Đồng thuận giữa các cặp người chấm", "",
       "| Cặp | Câu | Cùng chấm | Khớp | Tỉ lệ khớp | |", "|---|---|---|---|---|---|"]
for a, b in combinations(raters, 2):
    for key, ten in CAU:
        chung = [cid for cid in raters[a] if raters[a][cid].get(key) and raters[b].get(cid, {}).get(key)]
        if not chung:
            continue
        khop = [cid for cid in chung if raters[a][cid][key] == raters[b][cid][key]]
        tile = len(khop) / len(chung)
        co = "" if tile >= 0.8 else "⚠️ định nghĩa còn mơ hồ"
        print(f"  {a} vs {b} · {ten}: khớp {len(khop)}/{len(chung)} ({tile*100:.0f}%) {co}")
        md.append(f"| {a} vs {b} | {ten} | {len(chung)} | {len(khop)} | {tile*100:.0f}% | {co} |")

# case bị chấm lệch nhau — đây là chỗ đáng bàn nhất
lech = []
for row in ROWS:
    cid = row["id"]
    for key, ten in CAU:
        vals = {r: c.get(cid, {}).get(key) for r, c in raters.items() if c.get(cid, {}).get(key)}
        if len(set(vals.values())) > 1:
            lech.append((cid, ten, vals, row.get("desc", "")))
if lech:
    print(f"\n{len(lech)} chỗ chấm lệch nhau — mang ra bàn trước khi chốt chuẩn:")
    md += ["", "## Chỗ chấm lệch — mang ra bàn", "",
           "| Case | Tình huống | Câu | Ai chấm sao |", "|---|---|---|---|"]
    for cid, ten, vals, desc in lech:
        ai = " · ".join(f"{r}: {v}" for r, v in vals.items())
        print(f"  {cid}  {ten}  →  {ai}")
        md.append(f"| {cid} | {desc} | {ten} | {ai} |")

# ghi chú của từng người
notes = [(cid, r, c[cid]["ghi_chu"]) for r, c in raters.items() for cid in c if c[cid].get("ghi_chu")]
if notes:
    md += ["", "## Ghi chú", ""] + [f"- **{cid}** ({r}): {g}" for cid, r, g in notes]

open(os.path.join(ROOT, "eval", "human_review.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
print("\nĐã ghi eval/human_review.md")

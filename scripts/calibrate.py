"""Hiệu chỉnh SLOW_SEC / RUSH_SEC từ các phiên thật trong eval/human/.

    python scripts/calibrate.py
"""
import json
import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
graph = json.load(open(os.path.join(ROOT, "eval", "graph.json"), encoding="utf-8"))
HUMAN = os.path.join(ROOT, "eval", "human")

files = [f for f in os.listdir(HUMAN) if f.endswith(".json")] if os.path.isdir(HUMAN) else []
if not files:
    print('Chưa có phiên nào trong eval/human/ — chạy trang mock rồi bấm "Xuất phiên này thành case".')
    sys.exit(0)

right, wrong = [], []
for f in files:
    c = json.load(open(os.path.join(HUMAN, f), encoding="utf-8"))
    for i, (sel, sec) in enumerate(c.get("quiz", [])):
        if sel is None:
            continue  # bỏ trống thì thời gian không nói lên gì
        (right if sel == graph["QUIZ"][i]["answer"] else wrong).append(sec)
    for node, pairs in (c.get("probes") or {}).items():
        for i, (sel, sec) in enumerate(pairs):
            if sel is None:
                continue
            (right if sel == graph["PROBES"][node][i]["answer"] else wrong).append(sec)


def q(a, p):
    x = sorted(a)
    return x[min(len(x) - 1, int(p * len(x)))]


def line(name, a):
    if not a:
        return f"{name:<16}(chưa có)"
    return (f"{name:<16}n={len(a):>3}  p25={q(a,.25)}s  trung vị={q(a,.5)}s  "
            f"p75={q(a,.75)}s  p90={q(a,.9)}s")


print(f"\nHiệu chỉnh ngưỡng từ {len(files)} phiên thật\n")
print(line("Trả lời ĐÚNG", right))
print(line("Trả lời SAI", wrong))
if right:
    print(f"""
Đề xuất:
  SLOW_SEC = {q(right,.9)}   (p90 của câu trả lời đúng — chậm hơn mức này là bất thường so với chính nhóm)
  RUSH_SEC = {max(1, q(right,.25)//3)}   (1/3 của p25 — nhanh tới mức không kịp đọc hết đề)

Sửa hai hằng số ở CẢ HAI: scripts/engine.py và mockup/engine.js, rồi chạy:
  python scripts/run.py --write && python scripts/parity.py
Ghi n = số phiên vào spec.md §7 để nói rõ ngưỡng hiệu chỉnh trên bao nhiêu người.
""")

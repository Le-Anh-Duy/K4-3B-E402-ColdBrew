# -*- coding: utf-8 -*-
"""Nạp sẵn câu chẩn đoán cho các node còn trống trong probes.json.

    python scripts/gen_probes.py            # chỉ sinh cho node CHƯA có câu
    python scripts/gen_probes.py --node c1  # sinh lại đúng một node (ghi đè)
    python scripts/gen_probes.py --dry-run  # sinh và in ra, không ghi file

Bộ này là LƯỚI AN TOÀN: lúc chạy thật, `/probes/generate` vẫn sinh câu mới theo phiên;
ngân hàng tĩnh chỉ dùng khi LLM hỏng. Cần .env có GEMINI_API_KEY và data pack transcript.
"""
import argparse
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "codebase" / "backend"))

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from app.core import probe_gen  # noqa: E402

TREE_PATH = ROOT / "codebase/backend/app/data/tree.json"
PROBES_PATH = ROOT / "codebase/backend/app/data/probes.json"
MIN_GAP = 2.0   # không gọi Gemini hai lần cách nhau dưới 2s
COUNT = 3

parser = argparse.ArgumentParser()
parser.add_argument("--node", help="chỉ sinh cho một node, ghi đè câu cũ")
parser.add_argument("--dry-run", action="store_true", help="in ra, không ghi file")
args = parser.parse_args()

tree = json.loads(TREE_PATH.read_text(encoding="utf-8"))
probes = json.loads(PROBES_PATH.read_text(encoding="utf-8"))

if args.node:
    if args.node not in tree:
        sys.exit(f"Không có node {args.node} trong cây")
    targets = [args.node]
else:
    targets = [node_id for node_id in tree if node_id not in probes]

print(f"Sinh câu cho {len(targets)} node · {COUNT} câu/node · model từ .env\n")
ok, failed, last = 0, [], 0.0

for index, node_id in enumerate(targets, 1):
    node = tree[node_id]
    label = node.get("label", node_id)[:58]
    gap = MIN_GAP - (time.time() - last)
    if gap > 0:
        time.sleep(gap)
    last = time.time()

    try:
        result = probe_gen.generate(node_id, node, count=COUNT, task="gen_probes_script")
    except Exception as e:
        failed.append((node_id, str(e)[:90]))
        print(f"[{index:>2}/{len(targets)}] {node_id:<18} {label:<60} LỖI")
        continue

    questions = result["questions"]
    entry = probes.get(node_id, {})
    entry["questions"] = questions
    # `review` là gợi ý ôn lại; lấy mã đoạn có thật của node để không tạo trích dẫn rỗng.
    entry.setdefault("review", [f"Xem lại {node.get('page', '')}: {label}"])
    probes[node_id] = entry
    ok += 1
    drop = f" · loại {len(result['dropped'])}" if result["dropped"] else ""
    print(f"[{index:>2}/{len(targets)}] {node_id:<18} {label:<60} {len(questions)} câu{drop}")
    if args.dry_run:
        for question in questions:
            print(f"      Q: {question['q']}")
            for i, option in enumerate(question["options"]):
                print(f"        {'*' if i == question['answer'] else ' '} {option}")

if not args.dry_run and ok:
    PROBES_PATH.write_text(json.dumps(probes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nĐã ghi {PROBES_PATH.relative_to(ROOT)} — tổng {len(probes)}/{len(tree)} node có câu.")
else:
    print(f"\nDry-run, không ghi file. {ok} node sinh được.")

if failed:
    print(f"\n{len(failed)} node hỏng:")
    for node_id, reason in failed:
        print(f"  {node_id}: {reason}")
sys.exit(1 if failed and not ok else 0)

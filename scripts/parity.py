"""Chống lệch hai bản luật: scripts/engine.py (đo, backend) vs mockup/engine.js (trang demo).

Chạy cả hai trên toàn bộ golden set, khác nhau một case là fail.
Không có bước này thì số đo và cái chạy trên sân khấu có thể trôi khỏi nhau.

    python scripts/parity.py        (cần node để chạy bản JS)
"""
import json
import os
import subprocess
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine  # noqa: E402

graph = json.load(open(os.path.join(ROOT, "eval", "graph.json"), encoding="utf-8"))
cases = json.load(open(os.path.join(ROOT, "eval", "cases.json"), encoding="utf-8"))["cases"]

# cùng vòng lặp chẩn đoán như engine.diagnose, nhưng gọi luật bản JS
JS = r"""
const E = require('./mockup/engine.js');
const { TREE, QUIZ, PROBES } = require('./mockup/data.js');
const cases = JSON.parse(require('fs').readFileSync('eval/cases.json', 'utf8')).cases;
const split = (p) => [p.map((x) => x[0]), p.map((x) => x[1])];
const out = {};
for (const c of cases) {
  const [picked, times] = split(c.quiz);
  const records = E.grade(QUIZ, picked, times);
  const { target } = E.pickTarget(records, TREE);
  let final = null;
  if (c.probes && target && PROBES[target]) {
    let node = target, lastFailed = null;
    for (let round = 1; round <= E.MAX_ROUNDS; round++) {
      const ans = c.probes[node];
      if (!ans) { final = { scenario: 'thiếu đáp án probe cho ' + node, gap: null, ceiling: node }; break; }
      const [p, t] = split(ans);
      const recs = E.grade(PROBES[node], p, t);
      const d = E.roundDecision({ targetId: node, recs, round, tree: TREE, probes: PROBES, lastFailed });
      if (d.decision === 'locate' || d.decision === 'restart') {
        final = { scenario: d.scenario, gap: d.gap ?? null, ceiling: d.ceiling, prompt: E.PROMPT_KEY[d.scenario] ?? null };
        break;
      }
      lastFailed = d.failed;
      node = d.nextTarget;
    }
  }
  out[c.id] = { target: target ?? null, final };
}
console.log(JSON.stringify(out));
"""

try:
    raw = subprocess.run(["node", "-e", JS], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
except FileNotFoundError:
    print("\nKhông tìm thấy node — bỏ qua parity (chỉ cần khi sửa engine).\n")
    sys.exit(0)
if raw.returncode != 0:
    print(raw.stderr)
    sys.exit(1)
js = json.loads(raw.stdout)

bad = []
for c in cases:
    py = engine.diagnose(c["quiz"], c.get("probes"), graph)
    a = {"target": py["target"], "final": py["final"]}
    b = js[c["id"]]
    if json.dumps(a, sort_keys=True, ensure_ascii=False) != json.dumps(b, sort_keys=True, ensure_ascii=False):
        bad.append((c["id"], a, b))

if bad:
    print(f"\n❌ Hai bản luật đã lệch ở {len(bad)}/{len(cases)} case:\n")
    for cid, a, b in bad:
        print(f"  {cid}\n    engine.py: {a}\n    engine.js: {b}")
    print("\n-> Sửa cho khớp trước khi tin bất kỳ con số nào.\n")
    sys.exit(1)

print(f"\n✅ engine.py và engine.js cho kết quả giống nhau trên {len(cases)}/{len(cases)} case.\n")

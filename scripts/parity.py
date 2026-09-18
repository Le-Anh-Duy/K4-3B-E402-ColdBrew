"""Chống lệch BA bản luật: scripts/engine.py (bộ đo) · mockup/engine.js (trang mock offline)
· codebase/backend/app/core/engine.py (service thật).

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

sys.path.insert(0, os.path.join(ROOT, "codebase", "backend"))
try:
    from app.core import engine as be_engine  # noqa: E402
except Exception as _e:  # backend chưa cài fastapi/pydantic thì bỏ qua phần này
    be_engine = None
    print(f"(bỏ qua bản backend: {_e})")

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

def diagnose_backend(case):
    """Chạy đúng vòng lặp chẩn đoán nhưng bằng luật của backend."""
    tree, quiz, probes = graph["TREE"], graph["QUIZ"], graph["PROBES"]
    recs = be_engine.grade(quiz, [q[0] for q in case["quiz"]], [q[1] for q in case["quiz"]])
    target = be_engine.pick_target(recs, tree)["target"]
    final = None
    if case.get("probes") and target and target in probes:
        node, last_failed = target, None
        for rnd in range(1, be_engine.MAX_ROUNDS + 1):
            ans = case["probes"].get(node)
            if not ans:
                final = {"scenario": "thiếu đáp án probe cho " + node, "gap": None, "ceiling": node}
                break
            r = be_engine.grade(probes[node], [a[0] for a in ans], [a[1] for a in ans])
            d = be_engine.round_decision(node, r, rnd, tree, probes, last_failed)
            if d["decision"] in ("locate", "restart"):
                final = {"scenario": d["scenario"], "gap": d["gap"], "ceiling": d["ceiling"],
                         "prompt": d.get("prompt_key")}
                break
            last_failed = d.get("failed")
            node = d["next_target"]
    return {"target": target, "final": final}


bad, bad_be = [], []
for c in cases:
    py = engine.diagnose(c["quiz"], c.get("probes"), graph)
    if be_engine:
        a_be = diagnose_backend(c)
        if json.dumps(a_be, sort_keys=True, ensure_ascii=False) != json.dumps(
                {"target": py["target"], "final": py["final"]}, sort_keys=True, ensure_ascii=False):
            bad_be.append((c["id"], py, a_be))
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

n = len(cases)
print("")
print(f"OK — ba bản luật khớp nhau trên {n}/{n} case:")
print("   scripts/engine.py (bộ đo) · mockup/engine.js (trang mock) · backend/app/core/engine.py")


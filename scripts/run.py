"""S1 · Chạy golden set qua bộ luật chẩn đoán.

    python scripts/run.py            # in bảng
    python scripts/run.py --write    # ghi thêm eval/results.md

Dữ liệu: eval/graph.json (xuất từ mockup/data.js) + eval/cases.json + eval/human/*.json
"""
import json
import os
import sys

# Windows mặc định cp1252, in tiếng Việt là lỗi -> ép UTF-8 cho console
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine  # noqa: E402

GRAPH = os.path.join(ROOT, "eval", "graph.json")
DATA_JS = os.path.join(ROOT, "mockup", "data.js")
CASES = os.path.join(ROOT, "eval", "cases.json")
HUMAN = os.path.join(ROOT, "eval", "human")
RESULTS = os.path.join(ROOT, "eval", "results.md")

# Vân tay bộ câu hỏi: case gắn theo VỊ TRÍ câu hỏi, đổi quiz mà quên gán nhãn lại
# thì số đo vẫn xanh nhưng đã vô nghĩa.
FINGERPRINT = "l_quantinh,l_boctach,l_dungcaisai,l_phanky,l_hoitu|1,0,1,0,0"


def die(msg):
    print("\n" + msg + "\n")
    sys.exit(1)


if not os.path.exists(GRAPH):
    die("Chưa có eval/graph.json. Chạy: node scripts/export_graph.js")
if os.path.getmtime(DATA_JS) > os.path.getmtime(GRAPH):
    die("mockup/data.js mới hơn eval/graph.json — chạy lại: node scripts/export_graph.js")

graph = json.load(open(GRAPH, encoding="utf-8"))
TREE, QUIZ = graph["TREE"], graph["QUIZ"]

fp = ",".join(q["node"] for q in QUIZ) + "|" + ",".join(str(q["answer"]) for q in QUIZ)
if fp != FINGERPRINT:
    die(
        "QUIZ đã đổi so với lúc gán nhãn golden set.\n"
        f"   vân tay đã ghi:   {FINGERPRINT}\n"
        f"   vân tay hiện tại: {fp}\n"
        "   -> Gán nhãn lại eval/cases.json rồi cập nhật FINGERPRINT trong file này."
    )

cases = json.load(open(CASES, encoding="utf-8"))["cases"]
pending = 0
if os.path.isdir(HUMAN):
    for f in sorted(os.listdir(HUMAN)):
        if not f.endswith(".json"):
            continue
        c = json.load(open(os.path.join(HUMAN, f), encoding="utf-8"))
        if not c.get("expect") or c["expect"].get("target") == "?":
            pending += 1
            continue
        if c["expect"].get("target") in ("null", "không"):
            c["expect"]["target"] = None
        c["human"] = True
        cases.append(c)


def label(nid):
    if nid is None:
        return "(ý trong quiz)"
    return TREE[nid]["label"] if nid in TREE else nid


def fmt_final(f):
    if not f:
        return "—"
    return f"{f.get('scenario')} · hổng: {label(f.get('gap'))} · trần: {label(f.get('ceiling'))}"


rows, npass, cho = [], 0, []
for c in cases:
    if c.get("xfail"):        # case viết theo giả định, tính năng chưa build
        cho.append(c)
        continue
    got = engine.diagnose(c["quiz"], c.get("probes"), graph)
    ok_target = (got["target"] or None) == (c["expect"].get("target") or None)

    exp_final = c["expect"].get("final")
    ok_final = True
    if exp_final:
        g = got["final"] or {}
        ok_final = (
            g.get("scenario") == exp_final.get("scenario")
            and (g.get("gap") or None) == (exp_final.get("gap") or None)
            and (g.get("ceiling") or None) == (exp_final.get("ceiling") or None)
        )
        if exp_final.get("prompt"):
            ok_final = ok_final and g.get("prompt") == exp_final["prompt"]

    ok = ok_target and ok_final
    npass += ok
    rows.append({
        "id": c["id"] + (" 👤" if c.get("human") else ""),
        "desc": c["desc"],
        "expect": label(c["expect"].get("target")) + (f" → {fmt_final(exp_final)}" if exp_final else ""),
        "got": label(got["target"]) + (f" → {fmt_final(got['final'])}" if exp_final else ""),
        "ok": ok,
        "why": c.get("why", ""),
    })

do_cases = [c for c in cases if not c.get("xfail")]
pct = npass / len(do_cases) * 100
nhuman = sum(1 for c in do_cases if c.get("human"))
print(f"\nColdBrew · S1 chẩn đoán: {npass}/{len(cases)} đạt ({pct:.0f}%)")
print(f"  {len(cases) - nhuman} case nhóm soạn + {nhuman} case chạy thật"
      + (f" · {pending} case chờ điền nhãn" if pending else "") + "\n")
for r in rows:
    print(f"{'PASS' if r['ok'] else 'FAIL'}  {r['id']}  {r['desc']}")
if cho:
    print(chr(10) + f"── {len(cho)} case CHỜ TÍNH NĂNG (giả định nhóm đặt ra, chưa build) ──")
    for c in cho:
        print(f"CHỜ   {c['id']}  {c['desc']}")
        print(f"        giả định: {c['expect']['continuity']['bieu_hien']}")
        print(f"        thiếu:    {c['xfail']}")

for r in [r for r in rows if not r["ok"]]:
    print(f"\n{r['id']} — kỳ vọng: {r['expect']}\n     thực tế: {r['got']}\n     vì sao kỳ vọng vậy: {r['why']}")

if "--write" in sys.argv:
    md = [
        "# S1 · Kết quả chạy golden set",
        "",
        "Sinh tự động bằng `python scripts/run.py --write`",
        "",
        f"**{npass}/{len(do_cases)} case đạt ({pct:.0f}%)** — luật chẩn đoán `scripts/engine.py`, không gọi AI.",
        "",
        f"{len(do_cases) - nhuman} case nhóm soạn + {nhuman} case do thành viên chạy thật (👤)"
        + (f" · còn {pending} case chờ điền nhãn" if pending else "") + ".",
        "",
        "| Case | Tình huống | Kỳ vọng | Hệ thống trả về | |",
        "|---|---|---|---|---|",
    ]
    md += [f"| {r['id']} | {r['desc']} | {r['expect']} | {r['got']} | {'✅' if r['ok'] else '❌'} |" for r in rows]
    if cho:
        md += ["", f"## {len(cho)} case chờ tính năng — giả định nhóm đặt ra, chưa build", "",
               "| Case | Tình huống | Giả định phải đạt | Đang thiếu |", "|---|---|---|---|"]
        md += [f"| {c['id']} | {c['desc']} | {c['expect']['continuity']['bieu_hien']} | {c['xfail']} |"
               for c in cho]
    md += ["", "## Case chưa đạt", ""]
    fails = [r for r in rows if not r["ok"]]
    md += [f"- **{r['id']}** — {r['why']}" for r in fails] if fails else ["Không có."]
    open(RESULTS, "w", encoding="utf-8").write("\n".join(md) + "\n")
    print("\nĐã ghi eval/results.md")

sys.exit(0 if npass == len(do_cases) else 1)

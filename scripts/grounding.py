"""S2 · Số đo CP3 — cho sản phẩm chạy N hồ sơ, đếm bao nhiêu lượt ĐẠT.

    python scripts/grounding.py            # chạy toàn bộ case trong eval/cases.json
    python scripts/grounding.py --n 20     # chỉ chạy 20 case đầu
    python scripts/grounding.py --dry      # không gọi API, chỉ in prompt của case đầu

Chuẩn "đạt" (chốt TRƯỚC khi chạy, không sửa sau khi thấy kết quả) — một lượt phải qua cả ba:
  ① mọi mã đoạn AI trích ra đều TỒN TẠI trong cây
  ② mọi mã đoạn đều nằm trong phần tư liệu ĐƯỢC CẤP cho lượt đó (không đi lạc sang chỗ khác)
  ③ có đủ thành phần khung của kịch bản (ít nhất 1 trích dẫn + 1 câu hỏi tự kiểm)
Cột "hợp lý" do người đọc tick, ghi tay vào eval/grounding.md sau khi chạy.
"""
import json
import os
import re
import sys
import time

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine  # noqa: E402
import prompts  # noqa: E402

from dotenv import load_dotenv  # noqa: E402
from openai import OpenAI  # noqa: E402

load_dotenv(os.path.join(ROOT, ".env"))
MODEL = os.environ.get("MODEL", "gemini-2.5-flash")
BATCH, PAUSE = 10, 6  # gọi 10 lần thì nghỉ 6 giây, tránh đụng rate limit

graph = json.load(open(os.path.join(ROOT, "eval", "graph.json"), encoding="utf-8"))
INPUTS = os.path.join(ROOT, "eval", "cp3_inputs.json")
cases = json.load(open(INPUTS, encoding="utf-8"))["inputs"]
TREE, QUIZ = graph["TREE"], graph["QUIZ"]

ALL_SPANS = {s for n in TREE.values() for s in n["span"]}
SPAN_RE = re.compile(r"\[(T\d{2}-\d{3})\]")

if "--n" in sys.argv:
    cases = cases[: int(sys.argv[sys.argv.index("--n") + 1])]

client = OpenAI(api_key=os.environ.get("GEMINI_API_KEY"),
                base_url=os.environ.get("OPENAI_BASE_URL"))


def ask(system, user, retries=3):
    for i in range(retries):
        try:
            r = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            )
            return r.choices[0].message.content or ""
        except Exception as e:
            if i == retries - 1:
                return f"__LỖI__ {e}"
            time.sleep(5 * (i + 1))  # rate limit -> lùi dần rồi thử lại


def run_case(c):
    """Chạy trọn luồng: luật chẩn đoán -> chọn prompt -> gọi Gemini -> chấm 3 tiêu chí."""
    got = engine.diagnose(c["quiz"], c.get("probes"), graph)
    final = got["final"]
    if not final or not final.get("prompt"):
        return None  # case không đi tới bước tư vấn (từ chối chẩn đoán / thiếu probe)

    gap, ceiling = final.get("gap"), final.get("ceiling")
    level = engine.advice_level(gap or ceiling, None, TREE)
    records = engine.grade(QUIZ, [q[0] for q in c["quiz"]], [q[1] for q in c["quiz"]])
    user = prompts.build_user_msg(graph, gap, ceiling, level, records, QUIZ)
    system = prompts.PROMPTS[final["prompt"]]

    if "--dry" in sys.argv:
        print("=" * 70, "\nSYSTEM:\n", system, "\nUSER:\n", user)
        sys.exit(0)

    out = ask(system, user)
    cited = SPAN_RE.findall(out)
    # mọi mã đoạn XUẤT HIỆN trong tư liệu đã cấp đều hợp lệ — kể cả dòng "ba ý cốt lõi"
    allowed = set(SPAN_RE.findall(user))

    c1 = all(s in ALL_SPANS for s in cited)                  # mã đoạn có thật
    c2 = bool(cited) and all(s in allowed for s in cited)    # không đi lạc khỏi tư liệu được cấp
    c3 = bool(cited) and "?" in out                          # đủ khung: có trích dẫn + câu tự kiểm

    # ④ NỐI VÒNG: khi đã có trần (vòng trên trả lời đạt), lời tư vấn phải nhắc tới nó
    #    -> KHÔNG tính vào chuẩn CP3 (bar đã chốt trước khi chạy), chỉ báo cáo riêng
    c4 = None
    if ceiling and gap and ceiling != gap:
        c4 = (any(s in out for s in TREE[ceiling]["span"])
              or TREE[ceiling]["label"].split("·")[-1].strip()[:18] in out)
    return {
        "id": c["id"], "desc": c.get("desc", ""), "scenario": final["scenario"], "prompt": final["prompt"],
        "bai_lam": [l for l in user.split(chr(10)) if l.startswith("- Câu ")],
        "gap": gap, "ceiling": ceiling, "out": out.strip(), "cited": cited,
        "bad_span": [s for s in cited if s not in ALL_SPANS],
        "off_topic": [s for s in cited if s in ALL_SPANS and s not in allowed],
        "c1": c1, "c2": c2, "c3": c3, "c4": c4, "pass": c1 and c2 and c3,
    }


rows, n = [], 0
for c in cases:
    r = run_case(c)
    if not r:
        continue
    rows.append(r)
    n += 1
    print(f"{'ĐẠT ' if r['pass'] else 'TRƯỢT'}  {r['id']}  {r['scenario']:<14} "
          f"trích {len(r['cited'])} mã đoạn"
          + (f" · BỊA: {r['bad_span']}" if r["bad_span"] else "")
          + (f" · LẠC: {r['off_topic']}" if r["off_topic"] else ""))
    if n % BATCH == 0:
        print(f"  … nghỉ {PAUSE}s cho đỡ đụng rate limit")
        time.sleep(PAUSE)

ok = sum(r["pass"] for r in rows)
print(f"\nThử {len(rows)} lượt, {ok} lượt đạt cả ba tiêu chí ({ok / max(len(rows),1) * 100:.0f}%)")
print(f"  ① mã đoạn có thật: {sum(r['c1'] for r in rows)}/{len(rows)}")
print(f"  ② không trích lạc ngoài tư liệu được cấp: {sum(r['c2'] for r in rows)}/{len(rows)}")
print(f"  ③ đủ khung (có trích dẫn + câu tự kiểm): {sum(r['c3'] for r in rows)}/{len(rows)}")
co_tran = [r for r in rows if r["c4"] is not None]
if co_tran:
    print(f"  ④ nối vòng — có nhắc phần nền đã xác nhận ổn: "
          f"{sum(bool(r['c4']) for r in co_tran)}/{len(co_tran)}"
          "   (chưa tính vào chuẩn CP3, bar đã chốt trước khi chạy)")

md = [
    "# S2 · Số đo nội dung AI (CP3)",
    "", f"Model `{MODEL}` · sinh bằng `python scripts/grounding.py`", "",
    f"**Thử {len(rows)} lượt, {ok} lượt đạt ({ok / max(len(rows),1) * 100:.0f}%).**", "",
    "Chuẩn đạt (chốt trước khi chạy): ① mọi mã đoạn trích ra tồn tại trong cây · "
    "② không trích lạc ngoài tư liệu được cấp · ③ có trích dẫn và có câu tự kiểm.", "",
    "| Case | Kịch bản | ① có thật | ② không lạc | ③ đủ khung | Đạt | ④ nối vòng | Hợp lý? (người tick) |",
    "|---|---|---|---|---|---|---|---|",
]
md += [f"| {r['id']} | {r['scenario']} | {'✅' if r['c1'] else '❌'} | {'✅' if r['c2'] else '❌'} "
       f"| {'✅' if r['c3'] else '❌'} | {'✅' if r['pass'] else '❌'} "
       f"| {'—' if r['c4'] is None else ('✅' if r['c4'] else '❌')} |  |" for r in rows]
md += ["", "## Nội dung AI sinh ra", ""]
for r in rows:
    md += [f"### {r['id']} · {r['scenario']} · hổng: {r['gap'] or '(ý trong quiz)'}", "",
           "```", r["out"], "```", ""]
open(os.path.join(ROOT, "eval", "grounding.md"), "w", encoding="utf-8").write("\n".join(md))
json.dump({"model": MODEL, "rows": rows},
          open(os.path.join(ROOT, "eval", "grounding.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print("\nĐã ghi eval/grounding.md và eval/grounding.json")
print('Chấm tay hai câu hỏi người: python scripts/review_ui.py')

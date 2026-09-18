"""S2 · Số đo CP3 — cho sản phẩm chạy N hồ sơ, đếm bao nhiêu lượt ĐẠT.

    python scripts/grounding.py            # gọi thẳng Gemini (không cần backend)
    python scripts/grounding.py --api      # gọi QUA BACKEND thật (POST /ai/plan/generate)
    python scripts/grounding.py --n 20     # chỉ chạy N hồ sơ đầu
    python scripts/grounding.py --dry      # không gọi gì, in prompt của hồ sơ đầu

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
# Chặn rate limit ở hai tầng: giãn tối thiểu giữa hai lời gọi, và nghỉ dài sau mỗi lô.
BATCH, PAUSE = 10, 6      # 10 lời gọi -> nghỉ 6s
MIN_GAP = 1.5             # và không bao giờ gọi hai lần cách nhau dưới 1.5s
_last_call = [0.0]


def throttle():
    cho = MIN_GAP - (time.time() - _last_call[0])
    if cho > 0:
        time.sleep(cho)
    _last_call[0] = time.time()

graph = json.load(open(os.path.join(ROOT, "eval", "graph.json"), encoding="utf-8"))
INPUTS = os.path.join(ROOT, "eval", "cp3_inputs.json")
cases = json.load(open(INPUTS, encoding="utf-8"))["inputs"]
TREE, QUIZ = graph["TREE"], graph["QUIZ"]

ALL_SPANS = {s for n in TREE.values() for s in n["span"]}
SPAN_RE = re.compile(r"\[(T\d{2}-\d{3})\]")

if "--n" in sys.argv:
    cases = cases[: int(sys.argv[sys.argv.index("--n") + 1])]

USE_API = "--api" in sys.argv
API = os.environ.get("COLDBREW_API", "http://localhost:8000")

client = OpenAI(api_key=os.environ.get("GEMINI_API_KEY"),
                base_url=os.environ.get("OPENAI_BASE_URL"))


def ask_backend(final, records, trace):
    """Gọi đúng endpoint sản phẩm đang dùng, để số đo là số của service thật."""
    import urllib.request
    body = json.dumps({
        "verdict": "restart" if final["scenario"] == "nen_bai" else "located",
        "scenario": final["scenario"],
        "gap_node_id": final.get("gap"),
        "ceiling_node_id": final.get("ceiling"),
        "target_node_id": final.get("gap") or final.get("ceiling"),
        "records": records,
        "trace": trace,
    }).encode("utf-8")
    req = urllib.request.Request(API + "/api/v0/ai/plan/generate", data=body,
                                 headers={"Content-Type": "application/json"})
    for i in range(3):
        try:
            throttle()
            with urllib.request.urlopen(req, timeout=180) as r:
                res = json.loads(r.read())
            return res.get("advice_text") or "", set(res.get("allowed_spans") or [])
        except Exception as e:
            if i == 2:
                return f"__LỖI__ {e}", set()
            time.sleep(5 * (i + 1))   # nhiều khả năng dính rate limit -> lùi dần


def ask(system, user, retries=3):
    for i in range(retries):
        try:
            throttle()
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

    api_allowed = None
    if USE_API:
        out, api_allowed = ask_backend(
            final, records, [{"t": "Chẩn đoán", "d": f"kịch bản {final['scenario']}"}])
    else:
        out = ask(system, user)
    cited = SPAN_RE.findall(out)
    # Danh sách mã đoạn hợp lệ phải là thứ ĐÃ THỰC SỰ được cấp cho model.
    # Chế độ --api: lấy từ chính service (nó tự khai), không tự dựng lại ở phía bộ đo.
    allowed = api_allowed if api_allowed else set(SPAN_RE.findall(user))

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
        "gap": gap, "ceiling": ceiling,
        "gap_label": (TREE[gap]["label"] if gap else
                      "(một ý trong quiz: " + ", ".join(
                          TREE[r["node"]]["label"] for r in records if not r["correct"]) + ")"),
        "ceiling_label": (TREE[ceiling]["label"] if ceiling and ceiling != gap else ""),
        "out": out.strip(), "cited": cited,
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
    "", f"Model `{MODEL}` · sinh bằng `python scripts/grounding.py"
    + (" --api` (qua backend thật)" if USE_API else "`"), "",
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

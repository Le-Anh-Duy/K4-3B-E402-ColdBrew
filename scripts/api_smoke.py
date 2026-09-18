"""Rà toàn bộ endpoint backend — FE nhìn bảng này là biết cái nào cắm vào được.

    python scripts/api_smoke.py              # rà hết, các route AI gọi 1 lần mỗi cái
    python scripts/api_smoke.py --no-ai      # bỏ qua route gọi LLM (không tốn quota)

Cần backend đang chạy:  cd codebase/backend && python -m uvicorn app.main:app --port 8000
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

API = os.environ.get("COLDBREW_API", "http://localhost:8001") + "/api/v0"
NO_AI = "--no-ai" in sys.argv
MIN_GAP = 1.5          # không gọi LLM hai lần cách nhau dưới 1.5s
_last = [0.0]


def call(method, path, body=None, is_ai=False):
    if is_ai:
        cho = MIN_GAP - (time.time() - _last[0])
        if cho > 0:
            time.sleep(cho)
        _last[0] = time.time()
    url = API + path
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"Content-Type": "application/json"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read() or b"{}"), int((time.time() - t0) * 1000), None
    except urllib.error.HTTPError as e:
        return None, int((time.time() - t0) * 1000), f"HTTP {e.code}: {e.read()[:150].decode('utf-8', 'replace')}"
    except Exception as e:
        return None, int((time.time() - t0) * 1000), str(e)[:150]


rows = []


def check(ten, method, path, body=None, is_ai=False, must=()):
    res, ms, err = call(method, path, body, is_ai)
    if err:
        rows.append((ten, method + " " + path, "LỖI", ms, err))
        return None
    thieu = [k for k in must if not (res.get(k) if isinstance(res, dict) else res)]
    if isinstance(res, list) and must:
        thieu = [] if res else list(must)
    rows.append((ten, method + " " + path, "THIẾU " + ",".join(thieu) if thieu else "OK", ms, ""))
    return res


print(f"\nRà backend tại {API}" + ("  (bỏ qua route AI)" if NO_AI else "") + "\n")

# ---- dữ liệu tĩnh ----
check("Health", "GET", "/health", must=("ok",))
tree = check("Cây tri thức", "GET", "/graph/tree", must=("nodes",))
quiz = check("Đề quiz", "GET", "/quiz")
check("Câu chẩn đoán 1 node", "GET", "/probes/c3s1", must=("questions",))
src = check("Trích nguồn theo mã đoạn", "GET", "/source/T06-136", must=("text", "file"))
if src:
    # Mã đoạn phải trỏ đúng file transcript và trả nguyên văn, không rỗng.
    ok = src["file"] == "transcript-06-clean.md" and len(src["text"]) > 40
    rows.append(("  ↳ đúng file nguồn và có nguyên văn", "", "OK" if ok else "SAI", 0, ""))

# ---- chấm quiz: sai 2 câu của mục 3.1 ----
graded = check("Chấm quiz", "POST", "/quiz/grade",
               {"picked": [1, 0, 1, 2, 3], "times": [9, 8, 10, 13, 11]},
               must=("records",))

# ---- vòng chẩn đoán: mục trượt 2/3 -> phải escalate lên chương ----
r1 = check("Vòng chẩn đoán (trượt)", "POST", "/probes/evaluate-round",
           {"target_node_id": "c3s1", "round_num": 1, "picked": [1, 2, 0], "times": [9, 8, 10]},
           must=("decision",))
if r1:
    ok = r1["decision"] == "escalate" and r1.get("next_target") == "c3"
    rows.append(("  ↳ luật: trượt thì leo lên chương", "", "OK" if ok else f"SAI: {r1['decision']}", 0, ""))

# ---- vòng 2 đạt -> chỗ hổng phải là MỤC (c3s1), trần là CHƯƠNG (c3) ----
r2 = check("Vòng 2 đạt (có last_failed)", "POST", "/probes/evaluate-round",
           {"target_node_id": "c3", "round_num": 2, "picked": [0, 0, 0], "times": [9, 8, 11],
            "last_failed": "c3s1"},
           must=("decision", "scenario"))
if r2:
    ok = (r2.get("gap") == "c3s1" and r2.get("ceiling") == "c3"
          and r2.get("scenario") == "muc_duoi_tran" and r2.get("prompt_key") == "on_muc_co_tran")
    rows.append(("  ↳ luật: hổng ở MỤC, chương là trần", "",
                 "OK" if ok else f"SAI: gap={r2.get('gap')} trần={r2.get('ceiling')}", 0, ""))

# ---- phiên học ----
ses = check("Tạo phiên", "POST", "/session",
            {"owner": "smoke@coldbrew.test",
             "session": {"topic": "Chủ đề rà máy", "document": {"title": "Bộ rà"}, "questions": [{"id": "q1"}]}},
            must=("session_id",))
if ses:
    sid = ses["session_id"]
    check("Đọc phiên (resume)", "GET", f"/session/{sid}", must=("state", "session"))
    # camelCase và các khoá ngoài schema phải sống sót nguyên vẹn — đây là chỗ từng mất dữ liệu.
    rich = {"stage": "plan", "roundRecs": [{"node": "c3s1"}], "nextTarget": "c3",
            "plan": {"title": "Lộ trình do AI sinh"}, "drafts": {"quiz": {"index": 2}}}
    saved = check("Cập nhật phiên", "PUT", f"/session/{sid}", {"state": rich}, must=("state",))
    back = check("Đọc lại sau khi ghi", "GET", f"/session/{sid}", must=("state",))
    if back:
        kept = back["state"] == rich and (back.get("session") or {}).get("topic") == "Chủ đề rà máy"
        rows.append(("  ↳ state giữ nguyên vẹn, không rơi khoá", "", "OK" if kept else "SAI", 0,
                     "" if kept else f"nhận lại: {sorted((back.get('state') or {}).keys())}"))
    listed = check("Danh sách phiên theo học viên", "GET", "/session?owner=smoke@coldbrew.test")
    if isinstance(listed, list):
        found = any(item.get("session_id") == sid and item.get("has_plan") for item in listed)
        rows.append(("  ↳ tìm lại được phiên có lộ trình", "", "OK" if found else "SAI", 0, ""))
    check("Xoá phiên", "DELETE", f"/session/{sid}", must=("deleted",))

# ---- sổ token ----
usage = check("Sổ token theo tác vụ", "GET", "/usage", must=("calls", "by_task"))

# ---- các route gọi LLM ----
if not NO_AI:
    recs = (graded or {}).get("records", [])
    check("AI · giả thuyết chẩn đoán", "POST", "/ai/diagnosis/hypothesis",
          {"target_node_id": "c3s1",
           "hits": [{"node": "l_phanky", "label": "Phân kỳ", "flag": "wrong", "sec": 13}],
           "only_slow": False, "rushed_any": False},
          is_ai=True, must=("hypothesis_text",))
    q4 = (quiz or [{}])[3] if quiz and len(quiz) > 3 else {}
    check("AI · giải thích một câu", "POST", "/ai/explain/single",
          {"node_id": q4.get("node", "l_phanky"), "question": q4.get("q", ""),
           "options": q4.get("options", []), "correct_idx": q4.get("answer", 0),
           "selected_idx": 2, "time_sec": 13, "flag": "wrong"},
          is_ai=True, must=("explanation",) if False else ())
    plan = check("AI · lộ trình (theo kịch bản)", "POST", "/ai/plan/generate",
                 {"verdict": "located", "scenario": "muc_duoi_tran", "gap_node_id": "c3s1",
                  "ceiling_node_id": "c3", "target_node_id": "c3s1", "records": recs, "trace": []},
                 is_ai=True, must=("advice_text", "allowed_spans"))
    if plan:
        cited_ok = plan.get("prompt_key") == "on_muc_co_tran"
        rows.append(("  ↳ luật giao đúng prompt cho AI", "", "OK" if cited_ok else "SAI", 0, ""))
    check("AI · chat phản biện", "POST", "/ai/chat/message",
          {"target_node_id": "c3s1",
           "weak_signals": [{"node": "l_phanky", "label": "Phân kỳ", "flag": "wrong", "sec": 13}],
           "message": "Vì sao lại là mục này chứ không phải mục khác?", "history": []},
          is_ai=True, must=("reply",))

w = max(len(r[0]) for r in rows) + 1
print(f"{'Endpoint'.ljust(w)} {'Route'.ljust(34)} {'Kết quả'.ljust(10)} ms")
print("-" * (w + 52))
for ten, route, kq, ms, err in rows:
    print(f"{ten.ljust(w)} {route.ljust(34)} {kq.ljust(10)} {ms or ''}")
    if err:
        print(" " * (w + 2) + "→ " + err)

bad = [r for r in rows if r[2] != "OK"]
print(f"\n{len(rows) - len(bad)}/{len(rows)} mục OK" + (f" · {len(bad)} mục cần sửa" if bad else ""))
sys.exit(1 if bad else 0)

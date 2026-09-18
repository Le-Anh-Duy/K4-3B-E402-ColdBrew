"""S5 · Đo CHUỖI NHIỀU VÒNG — thứ mà S1 và S2 đều không chạm tới.

S1 đo luật leo cây. S2 đo một câu trả lời lẻ. Cái chưa ai đo: chạy trọn một phiên
nhiều vòng, AI nói ở TỪNG vòng, rồi xem các lời đó có nối được với nhau không.

    python scripts/multiround.py            # chạy 5 phiên qua backend
    python scripts/multiround.py --n 2      # chỉ chạy 2 phiên đầu

Mỗi vòng gọi 2 endpoint: /ai/explain/round (AI nhận xét vòng đó) rồi /probes/evaluate-round
(luật quyết đi tiếp hay dừng). Cuối phiên gọi /ai/plan/generate.
Kết quả: eval/multiround.json → chấm tay bằng scripts/review_rounds_ui.py
"""
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine  # noqa: E402
import validate  # noqa: E402

API = os.environ.get("COLDBREW_API", "http://localhost:8001") + "/api/v0"
RUN_ID = datetime.now().strftime("%Y%m%d-%H%M")
MIN_GAP, BATCH, PAUSE = 1.5, 10, 6      # chống rate limit
_last, _calls = [0.0], [0]

graph = json.load(open(os.path.join(ROOT, "eval", "graph.json"), encoding="utf-8"))
TREE, QUIZ, PROBES = graph["TREE"], graph["QUIZ"], graph["PROBES"]
ALL_SPANS = {s for n in TREE.values() for s in n.get("span", [])}
SPAN_RE = re.compile(r"\[(T\d{2}-\d{3})\]")


def post(path, body):
    cho = MIN_GAP - (time.time() - _last[0])
    if cho > 0:
        time.sleep(cho)
    _last[0] = time.time()
    _calls[0] += 1
    if _calls[0] % BATCH == 0:
        print(f"    … nghỉ {PAUSE}s cho đỡ đụng rate limit")
        time.sleep(PAUSE)
    req = urllib.request.Request(API + path, data=json.dumps(body).encode("utf-8"),
                                 headers={"Content-Type": "application/json"})
    for i in range(3):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(r.read())
        except Exception as e:
            if i == 2:
                return {"__loi__": str(e)[:200]}
            time.sleep(5 * (i + 1))


# ---- 5 phiên nhiều vòng, mỗi phiên nhắm một kiểu chuỗi khác nhau ----
W = {0: 0, 1: 2, 2: 0, 3: 2, 4: 2}     # phương án SAI cho từng câu quiz
R = [1, 0, 1, 0, 0]                    # phương án ĐÚNG


def quiz_ans(sai):
    return [[W[i] if i in sai else R[i], 9 + i] for i in range(5)]


def probe_ans(nsai, n=3):
    return [[0 if i >= nsai else 1, 9] for i in range(n)]


PHIEN = [
    {"id": "M01", "desc": "Mục 3.1 trượt → chương 3 ĐẠT (2 vòng)",
     "quiz": quiz_ans({3, 4}), "probes": {"c3s1": probe_ans(2), "c3": probe_ans(0)},
     "ky_vong": "vòng 2 phải ghi nhận chương ĐÃ ĐẠT, không được nói hổng ở chương"},
    {"id": "M02", "desc": "Mục 3.1 trượt → chương 3 cũng trượt → học lại bài",
     "quiz": quiz_ans({3, 4}), "probes": {"c3s1": probe_ans(3), "c3": probe_ans(3)},
     "ky_vong": "vòng 2 phải leo giọng lên mức cả bài, không lặp lại y nguyên vòng 1"},
    {"id": "M03", "desc": "Mục 1.1 trượt → chương 1 chỉ sai 1/3",
     "quiz": quiz_ans({0, 1}), "probes": {"c1s1": probe_ans(2), "c1": probe_ans(1)},
     "ky_vong": "chương gần đạt: phải phân biệt được 'gần đạt' với 'đạt hẳn'"},
    {"id": "M04", "desc": "Tiền đề: sai cả 1.1 và 3.1 → chẩn đoán xuống 1.1 → chương 1 đạt",
     "quiz": quiz_ans({0, 3, 4}), "probes": {"c1s1": probe_ans(2), "c1": probe_ans(0)},
     "ky_vong": "phải nói rõ vì sao đi vào 1.1 chứ không phải 3.1 (tiền đề)"},
    {"id": "M05", "desc": "Mục 3.2 trượt → chương 3 trượt (nhánh khác)",
     "quiz": quiz_ans({2}), "probes": {"c3s2": probe_ans(3), "c3": probe_ans(2)},
     "ky_vong": "chuỗi ở nhánh khác vẫn phải mạch lạc, không lẫn sang nhánh RAG"},
]

if "--n" in sys.argv:
    PHIEN = PHIEN[: int(sys.argv[sys.argv.index("--n") + 1])]


def tu(s):
    return set(re.findall(r"\w+", (s or "").lower()))


def chay_phien(p):
    records = engine.grade(QUIZ, [a[0] for a in p["quiz"]], [a[1] for a in p["quiz"]])
    target = engine.pick_target(records, TREE)["target"]
    vong, node, last_failed, rnd = [], target, None, 1

    while node and rnd <= engine.MAX_ROUNDS:
        ans = p["probes"].get(node)
        if not ans:
            break
        recs = engine.grade(PROBES[node], [a[0] for a in ans], [a[1] for a in ans])
        d = engine.round_decision(node, recs, rnd, TREE, PROBES, last_failed)

        # AI nhận xét CHÍNH vòng này
        ex = post("/ai/explain/round", {
            "target_node_id": node, "round_num": rnd, "decision": d["decision"],
            "records": [{"question": PROBES[node][i]["q"],
                         "options": PROBES[node][i]["options"],
                         "correct_idx": PROBES[node][i]["answer"],
                         "selected_idx": r["sel"], "sec": r["sec"],
                         "flag": r["flag"]} for i, r in enumerate(recs)],
        })
        vong.append({
            "vong": rnd, "node": node, "node_label": TREE[node]["label"],
            "decision": d["decision"], "bad": d["bad"],
            "ai_summary": ex.get("summary", ex.get("__loi__", "")),
            "ai_advice": ex.get("advice", ""),
        })
        if d["decision"] != "escalate":
            final = d
            break
        last_failed, node, rnd = d["failed"], d["nextTarget"], rnd + 1
    else:
        final = {"scenario": "leo", "gap": last_failed, "ceiling": node}

    plan = post("/ai/plan/generate", {
        "verdict": "restart" if final.get("scenario") == "nen_bai" else "located",
        "scenario": final.get("scenario"), "gap_node_id": final.get("gap"),
        "ceiling_node_id": final.get("ceiling"),
        "target_node_id": final.get("gap") or final.get("ceiling"),
        "records": records,
        "trace": [{"t": f"Vòng {v['vong']} · {v['node_label']}", "d": f"sai {v['bad']}/3"} for v in vong],
    })
    ket = plan.get("advice_text", plan.get("__loi__", ""))
    allowed = set(plan.get("allowed_spans") or [])

    gap, ceiling = final.get("gap"), final.get("ceiling")
    gap_label = TREE[gap]["label"] if gap else "(ý trong quiz)"
    ceil_label = TREE[ceiling]["label"] if ceiling else ""

    # ---- ba phép kiểm CHUỖI, chạy bằng máy ----
    k = {}
    k["moi_vong_bam_dung_node"] = all(
        (not SPAN_RE.findall(v["ai_summary"]))
        or set(SPAN_RE.findall(v["ai_summary"])) & set(TREE[v["node"]].get("span", []))
        for v in vong)
    lap = 0.0
    if len(vong) >= 2:
        a, b = tu(vong[0]["ai_summary"] + vong[0]["ai_advice"]), tu(vong[1]["ai_summary"] + vong[1]["ai_advice"])
        lap = len(a & b) / max(len(a | b), 1)
    k["khong_lap_lai_vong_truoc"] = lap < 0.6
    k["do_trung_lap"] = round(lap, 2)
    xau = [f"hổng ở {ceil_label}", f"chưa nắm {ceil_label}", f"hổng tại {ceil_label}"]
    k["khong_mau_thuan_tran"] = not (ceil_label and ceiling != gap
                                     and any(x.lower() in ket.lower() for x in xau))
    k["ket_luan_nhac_dung_cho_hong"] = bool(gap_label and gap_label.split("·")[-1].strip()[:18] in ket)
    k["bien_ban_ket_luan"] = validate.check_response(ket, allowed, ALL_SPANS, final.get("scenario"))

    dat = (k["moi_vong_bam_dung_node"] and k["khong_lap_lai_vong_truoc"]
           and k["khong_mau_thuan_tran"] and k["ket_luan_nhac_dung_cho_hong"])
    return {"id": p["id"], "desc": p["desc"], "ky_vong": p["ky_vong"], "run_id": RUN_ID,
            "so_vong": len(vong), "vong": vong, "scenario": final.get("scenario"),
            "gap": gap, "gap_label": gap_label, "ceiling": ceiling, "ceiling_label": ceil_label,
            "ket_luan": ket, "hash": hashlib.sha1(
                (ket + "".join(v["ai_summary"] for v in vong)).encode("utf-8")).hexdigest()[:8],
            "kiem": k, "dat": dat}


print(f"\nChạy {len(PHIEN)} phiên nhiều vòng qua {API}\n")
rows = []
for p in PHIEN:
    r = chay_phien(p)
    rows.append(r)
    print(f"{'ĐẠT ' if r['dat'] else 'TRƯỢT'}  {r['id']}  {r['so_vong']} vòng · {r['scenario']:<14} "
          f"hổng={r['gap_label'][:28]}")
    for key, nhan in (("moi_vong_bam_dung_node", "mỗi vòng bám đúng node"),
                      ("khong_lap_lai_vong_truoc", "không lặp lại vòng trước"),
                      ("khong_mau_thuan_tran", "không mâu thuẫn với trần"),
                      ("ket_luan_nhac_dung_cho_hong", "kết luận nhắc đúng chỗ hổng")):
        if not r["kiem"][key]:
            print(f"        ✗ {nhan}" + (f" (trùng {r['kiem']['do_trung_lap']})"
                                         if key == "khong_lap_lai_vong_truoc" else ""))

ok = sum(r["dat"] for r in rows)
print(f"\nS5 · chuỗi nhiều vòng: {ok}/{len(rows)} phiên đạt cả bốn phép kiểm")
for key, nhan in (("moi_vong_bam_dung_node", "mỗi vòng bám đúng node đang hỏi"),
                  ("khong_lap_lai_vong_truoc", "vòng sau không lặp lại vòng trước"),
                  ("khong_mau_thuan_tran", "không nói hổng ở node đã ĐẠT"),
                  ("ket_luan_nhac_dung_cho_hong", "kết luận nhắc đúng chỗ hổng")):
    print(f"  · {nhan}: {sum(r['kiem'][key] for r in rows)}/{len(rows)}")

out = {"run_id": RUN_ID, "rows": rows}
json.dump(out, open(os.path.join(ROOT, "eval", "multiround.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print(f"\nĐã ghi eval/multiround.json ({_calls[0]} lời gọi API)")
print("Chấm tay chuỗi: python scripts/review_rounds_ui.py")

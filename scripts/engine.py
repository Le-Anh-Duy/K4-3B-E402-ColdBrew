"""Bộ luật chẩn đoán ColdBrew — bản Python.

Đây là bản sẽ dùng cho backend FastAPI. `mockup/engine.js` là bản song sinh
phục vụ trang mock chạy offline; `scripts/parity.py` so hai bản trên toàn bộ
golden set, lệch một case là fail — không cho hai bản trôi khỏi nhau.
"""

SLOW_SEC = 25  # đúng nhưng lâu hơn mức này -> chưa chắc
RUSH_SEC = 3   # sai mà nhanh hơn mức này -> bấm bừa
MAX_ROUNDS = 3  # leo tối đa 3 tầng rồi kết luận "học lại từ đầu"

# Mỗi kịch bản chẩn đoán giao cho AI một việc khác nhau -> một system prompt khác nhau.
PROMPT_KEY = {
    "y_le": "giai_thich_y",            # nền mục vững, chỉ hổng đúng một ý
    "muc_nong": "on_muc_nong",         # sai 1/3 câu nền -> nhắc lại phần thiếu
    "muc_duoi_tran": "on_muc_co_tran",  # mục trượt nhưng tầng trên đã xác nhận ổn
    "nen_bai": "hoc_lai_bai",          # trượt tới tận nền -> học lại cả bài
}


def grade(items, picked, times):
    """flag: ok | slow (đúng nhưng chậm) | wrong | rush (sai rất nhanh) | skip (bỏ trống)"""
    out = []
    for i, q in enumerate(items):
        sel = picked[i] if i < len(picked) else None
        sec = times[i] if i < len(times) and times[i] else 0
        blank = sel is None
        correct = (not blank) and sel == q["answer"]
        if blank:
            flag = "skip"
        elif correct:
            flag = "slow" if sec > SLOW_SEC else "ok"
        else:
            flag = "rush" if sec < RUSH_SEC else "wrong"
        out.append({"node": q.get("node"), "sel": None if blank else sel,
                    "correct": correct, "sec": sec, "flag": flag})
    return out


def weak_signals(records):
    missed = [r for r in records if not r["correct"]]
    shaky = [r for r in records if r["flag"] == "slow"]
    return missed, shaky, (missed if missed else shaky)


def pick_target(records, tree):
    """Chọn node cha để chẩn đoán.

    1) gom tín hiệu theo node cha
    2) TỪ CHỐI chẩn đoán khi tín hiệu quá mỏng
    3) nhiều tín hiệu nhất; hoà thì lấy node xuất hiện sớm nhất trong bài
    4) nếu node chọn được có TIỀN ĐỀ cũng đang có tín hiệu -> xuống tiền đề trước
    """
    missed, shaky, candidates = weak_signals(records)
    if not candidates:
        return {"target": None, "hits": [], "reason": "không có tín hiệu yếu nào"}

    if all(r["flag"] == "rush" for r in candidates):
        return {"target": None, "hits": [],
                "reason": "các câu sai đều bấm dưới ngưỡng đọc hết đề — có thể bấm bừa"}

    order, by_parent = [], {}
    for r in candidates:
        p = tree[r["node"]]["parent"]
        if p not in by_parent:
            by_parent[p] = []
            order.append(p)
        by_parent[p].append(r)

    if not missed and all(len(by_parent[p]) < 2 for p in order):
        return {"target": None, "hits": [],
                "reason": "chỉ có câu trả lời chậm, lại tản mát ở nhiều mục — chưa đủ căn cứ"}

    target = order[0]
    for p in order:
        if len(by_parent[p]) > len(by_parent[target]):
            target = p

    seen = set()
    while target not in seen:
        seen.add(target)
        pre = next((i for i in tree[target].get("prereq", []) if i in by_parent and i not in seen), None)
        if not pre:
            break
        target = pre

    return {"target": target, "hits": [r["node"] for r in by_parent[target]]}


def round_decision(target_id, recs, rnd, tree, probes, last_failed=None):
    """Node TRƯỢT (sai >= 2/3) thì leo lên; node ĐẠT là TRẦN.

    Chỗ hổng là node SÂU NHẤT bị trượt, không phải node vừa hỏi.
    """
    bad = sum(1 for r in recs if not r["correct"])
    slow = sum(1 for r in recs if r["flag"] == "slow")
    up = tree[target_id]["parent"]
    base = {"bad": bad, "slow": slow, "ceiling": target_id}

    if bad == 0:
        if last_failed:
            return {**base, "decision": "locate", "gap": last_failed, "scenario": "muc_duoi_tran", "nextTarget": None}
        return {**base, "decision": "locate", "gap": None, "scenario": "y_le", "nextTarget": None}

    if bad == 1:
        return {**base, "decision": "locate",
                "gap": last_failed or target_id,
                "scenario": "muc_duoi_tran" if last_failed else "muc_nong",
                "nextTarget": None}

    if (not up) or up == "root" or rnd + 1 > MAX_ROUNDS or up not in probes:
        return {**base, "decision": "restart", "gap": target_id, "scenario": "nen_bai", "nextTarget": None}
    return {**base, "decision": "escalate", "gap": None, "scenario": "leo",
            "nextTarget": up, "failed": target_id}


def retest_passed(recs):
    """Kiểm tra lại sau khi ôn: chặt hơn vòng chẩn đoán, phải đúng hết."""
    return all(r["correct"] for r in recs)


def advice_level(node_id, verdict, tree):
    """Mức ôn suy từ VỊ TRÍ chỗ hổng: y < muc < chuong < bai."""
    if verdict == "restart" or node_id == "root" or node_id is None:
        return "bai" if verdict == "restart" or node_id == "root" else "y"
    n = tree.get(node_id)
    if not n:
        return "muc"
    if n["parent"] == "root":
        return "chuong"
    parent = tree.get(n["parent"])
    return "muc" if parent and parent["parent"] == "root" else "y"


def diagnose(case_quiz, case_probes, graph):
    """Chạy trọn một hồ sơ trả lời: quiz -> chọn node -> các vòng probe -> kết luận."""
    tree, quiz, probes = graph["TREE"], graph["QUIZ"], graph["PROBES"]
    picked = [p[0] for p in case_quiz]
    times = [p[1] for p in case_quiz]
    records = grade(quiz, picked, times)
    picked_target = pick_target(records, tree)
    target = picked_target["target"]

    result = {"target": target, "hits": picked_target["hits"], "final": None}
    if not case_probes or not target or target not in probes:
        return result

    node, last_failed = target, None
    for rnd in range(1, MAX_ROUNDS + 1):
        ans = case_probes.get(node)
        if not ans:
            result["final"] = {"scenario": "thiếu đáp án probe cho " + node, "gap": None, "ceiling": node}
            return result
        recs = grade(probes[node], [a[0] for a in ans], [a[1] for a in ans])
        d = round_decision(node, recs, rnd, tree, probes, last_failed)
        if d["decision"] in ("locate", "restart"):
            result["final"] = {"scenario": d["scenario"], "gap": d["gap"], "ceiling": d["ceiling"],
                               "prompt": PROMPT_KEY.get(d["scenario"])}
            return result
        last_failed = d["failed"]
        node = d["nextTarget"]
    return result

"""Bộ luật chẩn đoán — bản dùng chung cho backend và bộ đo.

Đồng bộ với `scripts/engine.py` (bộ đo) và `mockup/engine.js` (trang mock offline).
`python scripts/parity.py` chạy cả ba trên toàn bộ golden set, lệch một case là fail.

Nguyên tắc cốt lõi (khác bản cũ, đừng sửa nếu chưa đọc docs/data-model.md):
  · Node TRƯỢT (sai >= 2/3) thì leo lên; node ĐẠT là TRẦN.
  · CHỖ HỔNG là node SÂU NHẤT bị trượt — KHÔNG phải node vừa hỏi.
  · Có tiền đề (prereq) cũng đang hổng thì xuống tiền đề trước.
  · Tín hiệu quá mỏng thì TỪ CHỐI chẩn đoán, không đoán bừa.
"""
from typing import Any, Dict, List, Optional

from .config import MAX_ROUNDS, RUSH_SEC, SLOW_SEC

# Mỗi kịch bản giao cho AI một việc khác nhau -> một system prompt khác nhau
PROMPT_KEY = {
    "y_le": "giai_thich_y",             # nền mục vững, chỉ hổng đúng một ý
    "muc_nong": "on_muc_nong",          # sai 1/3 câu nền -> nhắc lại phần thiếu
    "muc_duoi_tran": "on_muc_co_tran",  # mục trượt nhưng tầng trên đã xác nhận ổn
    "nen_bai": "hoc_lai_bai",           # trượt tới tận nền -> học lại cả bài
}


def grade(items: List[Dict[str, Any]], picked: List[Optional[int]],
          times: Optional[List[int]] = None) -> List[Dict[str, Any]]:
    """ok · slow (đúng nhưng chậm) · wrong · rush (sai rất nhanh) · skip (bỏ trống)"""
    out = []
    for i, q in enumerate(items):
        sel = picked[i] if i < len(picked) else None
        sec = times[i] if times and i < len(times) and times[i] else 0
        blank = sel is None
        correct = (not blank) and sel == q.get("answer")
        if blank:
            flag = "skip"
        elif correct:
            flag = "slow" if sec > SLOW_SEC else "ok"
        else:
            flag = "rush" if sec < RUSH_SEC else "wrong"
        out.append({"node": q.get("node", ""), "sel": None if blank else sel,
                    "correct": correct, "sec": sec, "flag": flag})
    return out


def weak_signals(records: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    missed = [r for r in records if not r["correct"]]
    shaky = [r for r in records if r["flag"] == "slow"]
    return {"missed": missed, "shaky": shaky, "candidates": missed if missed else shaky}


def pick_target(records: List[Dict[str, Any]], tree: Dict[str, Any]) -> Dict[str, Any]:
    """Chọn node cha để chẩn đoán, hoặc TỪ CHỐI khi tín hiệu quá mỏng."""
    sig = weak_signals(records)
    missed, shaky, candidates = sig["missed"], sig["shaky"], sig["candidates"]

    def none(reason: str, conf: str = "none") -> Dict[str, Any]:
        return {"target": None, "hits": [], "missed": missed, "shaky": shaky,
                "confidence": conf, "reason": reason}

    if not candidates:
        return none("Không có tín hiệu yếu nào — không cần chẩn đoán.")

    # toàn bộ tín hiệu là bấm-quá-nhanh -> nhiều khả năng bấm bừa, hỏi lại trước
    if all(r["flag"] == "rush" for r in candidates):
        return none("Các câu sai đều bấm dưới ngưỡng đọc hết đề — có thể bấm bừa, cần hỏi lại.")

    order: List[str] = []
    by_parent: Dict[str, List[Dict[str, Any]]] = {}
    for r in candidates:
        p = tree.get(r["node"], {}).get("parent")
        if not p:
            continue
        if p not in by_parent:
            by_parent[p] = []
            order.append(p)
        by_parent[p].append(r)
    if not by_parent:
        return none("Không map được tín hiệu về node nào trong cây.")

    # chỉ có câu đúng-mà-chậm, lại tản mát mỗi mục một câu -> chưa đủ căn cứ
    if not missed and all(len(v) < 2 for v in by_parent.values()):
        return none("Chỉ có câu trả lời chậm, lại tản mát ở nhiều mục — chưa đủ căn cứ để khoanh vùng.")

    target = order[0]
    for p in order[1:]:
        if len(by_parent[p]) > len(by_parent[target]):
            target = p

    # ưu tiên TIỀN ĐỀ: hổng ở nền thì ôn phần phụ thuộc cũng vô ích
    seen = set()
    while target not in seen:
        seen.add(target)
        pre = next((i for i in tree.get(target, {}).get("prereq", [])
                    if i in by_parent and i not in seen), None)
        if not pre:
            break
        target = pre

    hits = [r["node"] for r in by_parent[target]]
    confidence = "thấp" if not missed else ("trung bình" if len(hits) >= 2 else "thấp")
    return {"target": target, "hits": hits, "missed": missed, "shaky": shaky,
            "confidence": confidence,
            "rushed_only": all(r["flag"] == "rush" for r in candidates)}


def round_decision(target_id: str, recs: List[Dict[str, Any]], round_num: int,
                   tree: Dict[str, Any], probes: Dict[str, Any],
                   last_failed: Optional[str] = None) -> Dict[str, Any]:
    """Kết luận sau một vòng probe.

    Trả về decision (locate|escalate|restart) + gap (chỗ hổng) + ceiling (trần)
    + scenario + prompt_key. `last_failed` là node sâu nhất đã TRƯỢT ở các vòng trước.
    """
    bad = sum(1 for r in recs if not r["correct"])
    slow = sum(1 for r in recs if r["flag"] == "slow")
    up = tree.get(target_id, {}).get("parent")
    base = {"bad": bad, "slow": slow, "ceiling": target_id, "next_target": None}

    def done(decision: str, gap: Optional[str], scenario: str, **extra) -> Dict[str, Any]:
        return {**base, "decision": decision, "gap": gap, "scenario": scenario,
                "prompt_key": PROMPT_KEY.get(scenario), **extra}

    # node này ĐẠT -> dừng, chỗ hổng nằm dưới trần
    if bad == 0:
        return (done("locate", last_failed, "muc_duoi_tran") if last_failed
                else done("locate", None, "y_le"))

    # gần đạt -> hổng nông ngay tại đây (hoặc ở node đã trượt sâu hơn)
    if bad == 1:
        return done("locate", last_failed or target_id,
                    "muc_duoi_tran" if last_failed else "muc_nong")

    # TRƯỢT
    if not up or up == "root" or round_num + 1 > MAX_ROUNDS or up not in probes:
        return done("restart", target_id, "nen_bai")
    return {**base, "decision": "escalate", "gap": None, "scenario": "leo",
            "prompt_key": None, "next_target": up, "failed": target_id}


def retest_passed(recs: List[Dict[str, Any]]) -> bool:
    """Kiểm tra lại sau khi ôn: chặt hơn vòng chẩn đoán, phải đúng hết."""
    return all(r["correct"] for r in recs)


def advice_level(node_id: Optional[str], verdict: Optional[str], tree: Dict[str, Any]) -> str:
    """Mức ôn suy từ VỊ TRÍ chỗ hổng: y < muc < chuong < bai."""
    if verdict == "restart" or node_id == "root":
        return "bai"
    if node_id is None:
        return "y"
    n = tree.get(node_id)
    if not n:
        return "muc"
    if n.get("parent") == "root":
        return "chuong"
    parent = tree.get(n.get("parent"))
    return "muc" if parent and parent.get("parent") == "root" else "y"

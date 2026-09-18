from typing import List, Dict, Any, Optional
from .config import SLOW_SEC, RUSH_SEC, MAX_ROUNDS

def grade(items: List[Dict[str, Any]], picked: List[Optional[int]], times: Optional[List[int]] = None) -> List[Dict[str, Any]]:
    """
    Gắn cờ cho từng câu trả lời:
    - ok: đúng và <= SLOW_SEC
    - slow: đúng nhưng > SLOW_SEC (chưa chắc chắn)
    - wrong: sai và >= RUSH_SEC
    - rush: sai trong < RUSH_SEC (bấm bừa)
    - skip: bỏ trống (không chọn)
    """
    results = []
    for i, q in enumerate(items):
        sel = picked[i] if i < len(picked) else None
        blank = sel is None
        correct = (not blank) and (sel == q.get("answer"))
        sec = times[i] if times and i < len(times) else 0

        if blank:
            flag = "skip"
        elif correct:
            flag = "slow" if sec > SLOW_SEC else "ok"
        else:
            flag = "rush" if sec < RUSH_SEC else "wrong"

        results.append({
            "node": q.get("node", ""),
            "sel": None if blank else sel,
            "correct": correct,
            "sec": sec,
            "flag": flag,
        })
    return results

def weak_signals(records: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Lọc ra các tín hiệu yếu: sai/bỏ trống và đúng nhưng chậm."""
    missed = [r for r in records if not r["correct"]]
    shaky = [r for r in records if r["flag"] == "slow"]
    candidates = missed if len(missed) > 0 else shaky
    return {
        "missed": missed,
        "shaky": shaky,
        "candidates": candidates
    }

def pick_target(records: List[Dict[str, Any]], tree: Dict[str, Any]) -> Dict[str, Any]:
    """
    Chọn node cha để chẩn đoán:
    - Gom candidates theo node cha
    - Fix C09: Nếu đúng hết và tất cả chỉ là slow rải rác mỗi node 1 câu -> từ chối chẩn đoán (target = None)
    - Fix C07: Ưu tiên node cha xuất hiện sớm hơn trong bài giảng nếu số lượng tín hiệu bằng nhau
    - Fix C10: Nếu 100% tín hiệu là rush -> gắn cờ có thể bấm bừa
    """
    signals = weak_signals(records)
    candidates = signals["candidates"]
    missed = signals["missed"]
    shaky = signals["shaky"]

    if not candidates:
        return {"target": None, "hits": [], "missed": missed, "shaky": shaky, "confidence": "none"}

    by_parent: Dict[str, List[Dict[str, Any]]] = {}
    order: List[str] = []

    for r in candidates:
        node_info = tree.get(r["node"], {})
        p = node_info.get("parent")
        if not p:
            continue
        if p not in by_parent:
            by_parent[p] = []
            order.append(p)
        by_parent[p].append(r)

    if not by_parent:
        return {"target": None, "hits": [], "missed": missed, "shaky": shaky, "confidence": "none"}

    # C09 Check: Nếu không có câu sai và mỗi nhóm cha chỉ có đúng 1 câu slow -> tín hiệu quá yếu, từ chối phán bừa
    if len(missed) == 0 and all(len(items) <= 1 for items in by_parent.values()):
        return {
            "target": None,
            "hits": [],
            "missed": missed,
            "shaky": shaky,
            "confidence": "none",
            "reason": "Mọi câu đều trả lời đúng, chỉ chậm rải rác không tập trung vào một chủ đề cụ thể."
        }

    # Chọn node cha có nhiều tín hiệu nhất; nếu bằng nhau thì lấy node xuất hiện trước (C07)
    target = order[0]
    for p in order[1:]:
        if len(by_parent[p]) > len(by_parent[target]):
            target = p

    hits = [r["node"] for r in by_parent[target]]
    rushed_only = all(r["flag"] == "rush" for r in candidates)
    only_slow = len(missed) == 0

    confidence = "thấp" if only_slow else ("trung bình" if (rushed_only or len(hits) >= 2) else "thấp")

    return {
        "target": target,
        "hits": hits,
        "missed": missed,
        "shaky": shaky,
        "confidence": confidence,
        "rushed_only": rushed_only
    }

def round_decision(
    target_id: str,
    recs: List[Dict[str, Any]],
    round_num: int,
    tree: Dict[str, Any],
    probes: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Quyết định sau một vòng câu hỏi nền:
    - locate: Sai/bỏ trống <= 1 -> Hổng khu trú tại node này
    - escalate: Sai/bỏ trống >= 2 -> Leo lên node cha tầng trên
    - restart: Chạm gốc, vượt quá MAX_ROUNDS, hoặc không còn probe tầng trên
    """
    bad = sum(1 for r in recs if not r["correct"])
    slow = sum(1 for r in recs if r["flag"] == "slow")
    up = tree.get(target_id, {}).get("parent")

    if bad <= 1:
        return {"decision": "locate", "next_target": None, "bad": bad, "slow": slow}

    if not up or up == "root" or round_num + 1 > MAX_ROUNDS or up not in probes:
        return {"decision": "restart", "next_target": None, "bad": bad, "slow": slow}

    return {"decision": "escalate", "next_target": up, "bad": bad, "slow": slow}

// Bộ luật chẩn đoán — KHÔNG gọi AI. Dùng chung cho trang mock (browser) và bộ eval (node).
// Đổi luật ở đây thì cả demo lẫn số đo cùng đổi, không lệch nhau.
// Bọc trong IIFE: chỉ ENGINE ra ngoài, để app.jsx destructure lại tên mà không đụng nhau.

const ENGINE = (() => {
  const SLOW_SEC = 25; // đúng nhưng lâu hơn mức này -> chưa chắc
  const RUSH_SEC = 3; // sai mà nhanh hơn mức này -> bấm bừa
  const MAX_ROUNDS = 3; // leo tối đa 3 tầng rồi kết luận "học lại từ đầu"

  // flag: ok | slow (đúng nhưng chậm) | wrong | rush (sai rất nhanh) | skip (bỏ trống)
  function grade(items, picked, times) {
    return items.map((q, i) => {
      const sel = picked[i];
      const blank = sel === undefined || sel === null;
      const correct = !blank && sel === q.answer;
      const sec = (times && times[i]) || 0;
      const flag = blank
        ? 'skip'
        : correct
        ? sec > SLOW_SEC
          ? 'slow'
          : 'ok'
        : sec < RUSH_SEC
        ? 'rush'
        : 'wrong';
      return { node: q.node, sel: blank ? null : sel, correct, sec, flag };
    });
  }

  // sai/bỏ trống là tín hiệu chính; đúng-mà-chậm chỉ dùng khi không có câu nào sai
  function weakSignals(records) {
    const missed = records.filter((r) => !r.correct);
    const shaky = records.filter((r) => r.flag === 'slow');
    return { missed, shaky, candidates: missed.length ? missed : shaky };
  }

  // chọn node cha để chẩn đoán. Thứ tự luật:
  //   1) gom tín hiệu theo node cha
  //   2) TỪ CHỐI chẩn đoán khi tín hiệu quá mỏng (bấm bừa, hoặc chậm mà tản mát)
  //   3) nhiều tín hiệu nhất; hoà thì lấy node xuất hiện sớm nhất trong bài
  //   4) nếu node chọn được có TIỀN ĐỀ (prereq) cũng đang có tín hiệu -> xuống tiền đề trước
  function pickTarget(records, tree) {
    const { missed, shaky, candidates } = weakSignals(records);
    const none = (reason) => ({ target: null, hits: [], missed, shaky, reason });
    if (!candidates.length) return none('không có tín hiệu yếu nào');

    // (2a) toàn bộ tín hiệu đều là bấm-quá-nhanh -> nhiều khả năng bấm bừa, hỏi lại đã
    if (candidates.every((r) => r.flag === 'rush'))
      return none('các câu sai đều bấm dưới ngưỡng đọc hết đề — có thể bấm bừa, cần hỏi lại trước');

    const order = [];
    const byParent = {};
    candidates.forEach((r) => {
      const p = tree[r.node].parent;
      if (!byParent[p]) {
        byParent[p] = [];
        order.push(p);
      }
      byParent[p].push(r);
    });

    // (2b) chỉ có tín hiệu "đúng nhưng chậm" và tản mát mỗi nơi một câu -> chưa đủ căn cứ
    if (!missed.length && order.every((p) => byParent[p].length < 2))
      return none('chỉ có câu trả lời chậm, lại tản mát ở nhiều mục — chưa đủ căn cứ để khoanh vùng');

    let target = order.reduce((best, p) => (byParent[p].length > byParent[best].length ? p : best));

    // (4) ưu tiên tiền đề: hổng ở nền thì ôn phần sau cũng vô ích
    const seen = new Set();
    while (!seen.has(target)) {
      seen.add(target);
      const pre = (tree[target].prereq || []).find((id) => byParent[id] && !seen.has(id));
      if (!pre) break;
      target = pre;
    }

    return { target, hits: byParent[target].map((r) => r.node), missed, shaky };
  }

  // sau một vòng câu hỏi nền: chốt tại chỗ, leo lên, hay bỏ cuộc và học lại cả bài
  function roundDecision({ targetId, recs, round, tree, probes }) {
    const bad = recs.filter((r) => !r.correct).length;
    const slow = recs.filter((r) => r.flag === 'slow').length;
    const up = tree[targetId].parent;

    if (bad <= 1) return { decision: 'locate', nextTarget: null, bad, slow };
    if (!up || up === 'root' || round + 1 > MAX_ROUNDS || !probes[up])
      return { decision: 'restart', nextTarget: null, bad, slow };
    return { decision: 'escalate', nextTarget: up, bad, slow };
  }

  // kiểm tra lại sau khi ôn: chặt hơn vòng chẩn đoán — phải đúng hết mới xoá cờ hổng
  function retestPassed(recs) {
    return recs.every((r) => r.correct);
  }

  // mức ôn suy ra từ vị trí node trên cây, KHÔNG do LLM quyết
  function adviceLevel(nodeId, verdict, tree) {
    if (verdict === 'restart' || nodeId === 'root') return 'bai';
    return tree[nodeId].parent === 'root' ? 'chuong' : 'muc';
  }

  return {
    SLOW_SEC, RUSH_SEC, MAX_ROUNDS,
    grade, weakSignals, pickTarget, roundDecision, retestPassed, adviceLevel,
  };
})();

if (typeof module !== 'undefined') module.exports = ENGINE;

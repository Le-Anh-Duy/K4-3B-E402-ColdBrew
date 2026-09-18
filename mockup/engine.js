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

  // chọn node cha để chẩn đoán: nhiều tín hiệu nhất; hoà thì lấy node xuất hiện sớm nhất trong bài
  function pickTarget(records, tree) {
    const { missed, shaky, candidates } = weakSignals(records);
    if (!candidates.length) return { target: null, hits: [], missed, shaky };

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
    const target = order.reduce((best, p) =>
      byParent[p].length > byParent[best].length ? p : best
    );
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

  return { SLOW_SEC, RUSH_SEC, MAX_ROUNDS, grade, weakSignals, pickTarget, roundDecision };
})();

if (typeof module !== 'undefined') module.exports = ENGINE;

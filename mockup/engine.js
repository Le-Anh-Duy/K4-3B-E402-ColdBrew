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

  // Sau một vòng câu hỏi nền. Nguyên tắc: node TRƯỢT (sai >= 2/3) thì leo lên;
  // node ĐẠT là TRẦN — đã xác nhận nền tới đó ổn. Chỗ hổng là node SÂU NHẤT bị trượt,
  // KHÔNG phải node vừa hỏi. Nếu chưa node nào trượt thì hổng nằm ở chính ý trong quiz.
  //   lastFailed = node sâu nhất đã trượt ở các vòng trước (null nếu chưa có)
  function roundDecision({ targetId, recs, round, tree, probes, lastFailed = null }) {
    const bad = recs.filter((r) => !r.correct).length;
    const slow = recs.filter((r) => r.flag === 'slow').length;
    const up = tree[targetId].parent;
    const base = { bad, slow, ceiling: targetId };

    // node này ĐẠT -> dừng. Chỗ hổng nằm dưới trần này.
    if (bad === 0)
      return lastFailed
        ? { ...base, decision: 'locate', gap: lastFailed, scenario: 'muc_duoi_tran', nextTarget: null }
        : { ...base, decision: 'locate', gap: null, scenario: 'y_le', nextTarget: null };

    // gần đạt: sai đúng 1 câu -> hổng nông, khu trú ngay tại đây (hoặc ở node đã trượt sâu hơn)
    if (bad === 1)
      return {
        ...base,
        decision: 'locate',
        gap: lastFailed || targetId,
        scenario: lastFailed ? 'muc_duoi_tran' : 'muc_nong',
        nextTarget: null,
      };

    // TRƯỢT -> leo lên, ghi lại đây là node trượt sâu nhất
    if (!up || up === 'root' || round + 1 > MAX_ROUNDS || !probes[up])
      return { ...base, decision: 'restart', gap: targetId, scenario: 'nen_bai', nextTarget: null };
    return { ...base, decision: 'escalate', gap: null, scenario: 'leo', nextTarget: up, failed: targetId };
  }

  // kiểm tra lại sau khi ôn: chặt hơn vòng chẩn đoán — phải đúng hết mới xoá cờ hổng
  function retestPassed(recs) {
    return recs.every((r) => r.correct);
  }

  // mức ôn suy ra từ VỊ TRÍ CHỖ HỔNG trên cây, KHÔNG do LLM quyết
  //   y = một ý trong mục · muc · chuong · bai
  function adviceLevel(nodeId, verdict, tree) {
    if (verdict === 'restart' || nodeId === 'root') return 'bai';
    const n = tree[nodeId];
    if (!n) return 'muc';
    if (n.parent === 'root') return 'chuong';
    return tree[n.parent] && tree[n.parent].parent === 'root' ? 'muc' : 'y';
  }

  // Mỗi kịch bản chẩn đoán giao cho AI một việc khác nhau -> một system prompt khác nhau.
  // Rule chọn kịch bản; AI chỉ viết nội dung trong khung của kịch bản đó.
  const PROMPT_KEY = {
    y_le: 'giai_thich_y', // nền mục vững, chỉ hổng đúng một ý
    muc_nong: 'on_muc_nong', // sai 1/3 câu nền -> nhắc lại phần thiếu
    muc_duoi_tran: 'on_muc_co_tran', // mục trượt nhưng chương đã xác nhận ổn
    nen_bai: 'hoc_lai_bai', // trượt tới tận nền -> học lại cả bài
  };

  return {
    SLOW_SEC, RUSH_SEC, MAX_ROUNDS,
    grade, weakSignals, pickTarget, roundDecision, retestPassed, adviceLevel, PROMPT_KEY,
  };
})();

if (typeof module !== 'undefined') module.exports = ENGINE;

// Xuất cây tri thức từ mockup/data.js ra eval/graph.json để script Python đọc được.
// Chạy lại mỗi khi sửa data.js:  node scripts/export_graph.js
const fs = require('fs');
const path = require('path');
const d = require('../mockup/data.js');

const out = path.join(__dirname, '..', 'eval', 'graph.json');
fs.writeFileSync(
  out,
  JSON.stringify(
    { SRC: d.SRC, TREE: d.TREE, QUIZ: d.QUIZ, PROBES: d.PROBES, EXPLAIN: d.EXPLAIN, PROBE_WHY: d.PROBE_WHY, REVIEW: d.REVIEW },
    null,
    2
  ),
  'utf8'
);
console.log('Đã ghi eval/graph.json ·', Object.keys(d.TREE).length, 'node');

// Sinh luôn dữ liệu cho backend theo đúng shape các router đang đọc.
// Một nguồn sự thật duy nhất: mockup/data.js -> eval/graph.json + backend/app/data/*.json
const beDir = path.join(__dirname, '..', 'codebase', 'backend', 'app', 'data');
if (fs.existsSync(beDir)) {
  fs.writeFileSync(path.join(beDir, 'tree.json'), JSON.stringify(d.TREE, null, 2), 'utf8');

  // quiz.json KHÔNG còn được sinh ra ở đây. Backend giữ một ngân hàng câu hỏi
  // rộng hơn (GET /quiz?count=5..20) mà mockup không có. Ghi đè sẽ xoá mất
  // phần mở rộng đó. Thay vào đó chỉ KIỂM: 5 câu đầu của backend phải trùng
  // đúng bộ 5 câu của mockup, vì golden set gắn nhãn theo bộ 5 câu này.
  const quizPath = path.join(beDir, 'quiz.json');
  if (fs.existsSync(quizPath)) {
    const be = JSON.parse(fs.readFileSync(quizPath, 'utf8'));
    const lech = d.QUIZ.map((q, i) => {
      const b = be[i];
      if (!b) return `câu ${i + 1}: backend thiếu`;
      if (b.node !== q.node) return `câu ${i + 1}: node ${b.node} != ${q.node}`;
      if (b.answer !== q.answer) return `câu ${i + 1}: đáp án ${b.answer} != ${q.answer}`;
      return null;
    }).filter(Boolean);
    if (lech.length) {
      console.error('LỆCH giữa mockup/data.js và backend quiz.json:');
      lech.forEach((m) => console.error('  - ' + m));
      console.error('Golden set gắn nhãn theo bộ 5 câu của mockup. Sửa cho khớp rồi chạy lại.');
      process.exit(1);
    }
    console.log(`quiz.json: ${be.length} câu ở backend, 5 câu đầu khớp mockup (không ghi đè)`);
  }

  const probes = {};
  for (const [node, items] of Object.entries(d.PROBES)) {
    probes[node] = {
      questions: items.map((it, i) => ({
        q: it.q,
        options: it.options,
        answer: it.answer,
        why: (d.PROBE_WHY[node] || [])[i] || '',
      })),
      review: d.REVIEW[node] || [],
    };
  }
  fs.writeFileSync(path.join(beDir, 'probes.json'), JSON.stringify(probes, null, 2), 'utf8');
  console.log('Đã ghi codebase/backend/app/data/{tree,quiz,probes}.json');
}

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

  const quiz = d.QUIZ.map((q, i) => ({
    id: 'q' + (i + 1),
    node: q.node,
    q: q.q,
    options: q.options,
    answer: q.answer,
    why: (d.EXPLAIN[q.node] || {}).why || '',
    traps: (d.EXPLAIN[q.node] || {}).traps || {},
  }));
  fs.writeFileSync(path.join(beDir, 'quiz.json'), JSON.stringify(quiz, null, 2), 'utf8');

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

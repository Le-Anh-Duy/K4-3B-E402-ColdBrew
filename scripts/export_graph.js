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

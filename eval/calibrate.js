// Hiệu chỉnh SLOW_SEC / RUSH_SEC từ các phiên thật trong eval/human/.
//   node eval/calibrate.js
const fs = require('fs');
const path = require('path');
const { QUIZ, PROBES, TREE } = require('../mockup/data.js');

const dir = path.join(__dirname, 'human');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
if (!files.length) {
  console.log('Chưa có phiên nào trong eval/human/ — chạy trang mock rồi bấm "Xuất phiên này thành case".');
  process.exit(0);
}

const right = [];
const wrong = [];
for (const f of files) {
  const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  (c.quiz || []).forEach(([sel, sec], i) => {
    if (sel === null) return; // bỏ trống thì thời gian không nói lên gì
    (sel === QUIZ[i].answer ? right : wrong).push(sec);
  });
  Object.entries(c.probes || {}).forEach(([node, pairs]) =>
    pairs.forEach(([sel, sec], i) => {
      if (sel === null) return;
      (sel === PROBES[node][i].answer ? right : wrong).push(sec);
    })
  );
}

const q = (a, p) => {
  const x = [...a].sort((m, n) => m - n);
  return x[Math.min(x.length - 1, Math.floor(p * x.length))];
};
const line = (name, a) =>
  a.length
    ? `${name.padEnd(14)} n=${String(a.length).padStart(3)}  p25=${q(a, 0.25)}s  trung vị=${q(a, 0.5)}s  p75=${q(a, 0.75)}s  p90=${q(a, 0.9)}s`
    : `${name.padEnd(14)} (chưa có)`;

console.log(`\nHiệu chỉnh ngưỡng từ ${files.length} phiên thật\n`);
console.log(line('Trả lời ĐÚNG', right));
console.log(line('Trả lời SAI', wrong));
console.log(`
Đề xuất:
  SLOW_SEC = ${right.length ? q(right, 0.9) : '?'}   (p90 của câu trả lời đúng — chậm hơn mức này thì bất thường so với chính nhóm)
  RUSH_SEC = ${right.length ? Math.max(1, Math.floor(q(right, 0.25) / 3)) : '?'}   (1/3 của p25 — nhanh tới mức không kịp đọc hết đề)

Sửa hai hằng số trong mockup/engine.js rồi chạy lại: node eval/run.js --write
Ghi n = số phiên vào spec.md §7 để nói rõ ngưỡng hiệu chỉnh trên bao nhiêu người.
`);

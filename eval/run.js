// Chạy golden set qua đúng bộ luật mà trang mock đang dùng (mockup/engine.js).
//   node eval/run.js            -> in bảng ra màn hình
//   node eval/run.js --write    -> ghi thêm eval/results.md
const fs = require('fs');
const path = require('path');

const E = require('../mockup/engine.js');
const { TREE, QUIZ, PROBES } = require('../mockup/data.js');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf8')).cases;
const split = (pairs) => [pairs.map((p) => p[0]), pairs.map((p) => p[1])];

function runCase(c) {
  const [picked, times] = split(c.quiz);
  const records = E.grade(QUIZ, picked, times);
  const { target } = E.pickTarget(records, TREE);

  let final = null;
  if (c.probes && target && PROBES[target]) {
    let node = target;
    for (let round = 1; round <= E.MAX_ROUNDS; round++) {
      const ans = c.probes[node];
      if (!ans) {
        final = { verdict: 'thiếu đáp án probe cho ' + node, node };
        break;
      }
      const [p, t] = split(ans);
      const recs = E.grade(PROBES[node], p, t);
      const d = E.roundDecision({ targetId: node, recs, round, tree: TREE, probes: PROBES });
      if (d.decision === 'locate') {
        final = { verdict: 'located', node };
        break;
      }
      if (d.decision === 'restart') {
        final = { verdict: 'restart', node };
        break;
      }
      node = d.nextTarget;
    }
  }
  return { target, final };
}

const label = (id) => (id ? TREE[id].label : '(không chẩn đoán)');
const rows = [];
let pass = 0;

for (const c of cases) {
  const got = runCase(c);
  const okTarget = (got.target || null) === (c.expect.target || null);
  const okFinal =
    !c.expect.final ||
    (got.final &&
      got.final.verdict === c.expect.final.verdict &&
      got.final.node === c.expect.final.node);
  const ok = okTarget && okFinal;
  if (ok) pass++;

  rows.push({
    id: c.id,
    desc: c.desc,
    expect:
      label(c.expect.target) +
      (c.expect.final ? ` → ${c.expect.final.verdict} @ ${label(c.expect.final.node)}` : ''),
    got:
      label(got.target) +
      (c.expect.final
        ? ` → ${got.final ? `${got.final.verdict} @ ${label(got.final.node)}` : '(không có)'}`
        : ''),
    ok,
    why: c.why,
  });
}

const pct = ((pass / cases.length) * 100).toFixed(0);
console.log(`\nColdBrew · golden set: ${pass}/${cases.length} đạt (${pct}%)\n`);
for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.desc}`);
for (const r of rows.filter((r) => !r.ok))
  console.log(`\n${r.id} — kỳ vọng: ${r.expect}\n     thực tế: ${r.got}\n     vì sao kỳ vọng vậy: ${r.why}`);

if (process.argv.includes('--write')) {
  const md = [
    '# Kết quả chạy golden set',
    '',
    `Sinh tự động bằng \`node eval/run.js --write\` · ${new Date().toISOString().slice(0, 10)}`,
    '',
    `**${pass}/${cases.length} case đạt (${pct}%)** — luật chẩn đoán trong \`mockup/engine.js\`, không gọi AI.`,
    '',
    '| Case | Tình huống | Kỳ vọng | Hệ thống trả về | |',
    '|---|---|---|---|---|',
    ...rows.map(
      (r) => `| ${r.id} | ${r.desc} | ${r.expect} | ${r.got} | ${r.ok ? '✅' : '❌'} |`
    ),
    '',
    '## Case chưa đạt',
    '',
    ...(rows.some((r) => !r.ok)
      ? rows.filter((r) => !r.ok).map((r) => `- **${r.id}** — ${r.why}`)
      : ['Không có.']),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(__dirname, 'results.md'), md, 'utf8');
  console.log('\nĐã ghi eval/results.md');
}

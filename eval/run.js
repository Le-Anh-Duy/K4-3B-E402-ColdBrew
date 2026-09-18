// Chạy golden set qua đúng bộ luật mà trang mock đang dùng (mockup/engine.js).
//   node eval/run.js            -> in bảng ra màn hình
//   node eval/run.js --write    -> ghi thêm eval/results.md
const fs = require('fs');
const path = require('path');

const E = require('../mockup/engine.js');
const { TREE, QUIZ, PROBES } = require('../mockup/data.js');

// Vân tay bộ câu hỏi: case gắn theo VỊ TRÍ câu hỏi, nên đổi QUIZ mà quên sửa case thì
// số đo vẫn xanh nhưng đã vô nghĩa. Lệch vân tay là dừng, bắt gán nhãn lại.
const FINGERPRINT = 'l_quantinh,l_boctach,l_dungcaisai,l_phanky,l_hoitu|1,0,1,0,0';
const fp = QUIZ.map((q) => q.node).join(',') + '|' + QUIZ.map((q) => q.answer).join(',');
if (fp !== FINGERPRINT) {
  console.error('');
  console.error('QUIZ da doi so voi luc gan nhan golden set.');
  console.error('   van tay da ghi:   ' + FINGERPRINT);
  console.error('   van tay hien tai: ' + fp);
  console.error('   -> Gan nhan lai eval/cases.json roi cap nhat FINGERPRINT trong file nay.');
  process.exit(1);
}

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases.json'), 'utf8')).cases;

// thêm case do người trong nhóm tự chạy (eval/human/*.json); bỏ qua case chưa điền nhãn
const humanDir = path.join(__dirname, 'human');
let pending = 0;
if (fs.existsSync(humanDir)) {
  for (const f of fs.readdirSync(humanDir).filter((f) => f.endsWith('.json'))) {
    const c = JSON.parse(fs.readFileSync(path.join(humanDir, f), 'utf8'));
    if (!c.expect || c.expect.target === '?') {
      pending++;
      continue;
    }
    if (c.expect.target === 'null' || c.expect.target === 'không') c.expect.target = null;
    if (c.expect.final && c.expect.final.verdict === '?') delete c.expect.final;
    c.human = true;
    cases.push(c);
  }
}
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
    id: c.id + (c.human ? ' 👤' : ''),
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
const nHuman = cases.filter((c) => c.human).length;
console.log(`\nColdBrew · golden set: ${pass}/${cases.length} đạt (${pct}%)`);
console.log(
  `  ${cases.length - nHuman} case nhóm soạn + ${nHuman} case chạy thật${
    pending ? ` · ${pending} case chờ điền nhãn` : ''
  }\n`
);
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
    `${cases.length - nHuman} case nhóm soạn + ${nHuman} case do thành viên chạy thật (👤)${
      pending ? ` · còn ${pending} case chờ điền nhãn` : ''
    }.`,
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

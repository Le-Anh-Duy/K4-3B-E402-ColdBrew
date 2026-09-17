const { useState, useEffect, useRef } = React;

const SAVE_KEY = 'coldbrew-mock-session';
const MAX_ROUNDS = 3; // leo tối đa 3 tầng rồi kết luận "học lại từ đầu"
const SLOW_SEC = 25; // đúng nhưng lâu hơn mức này -> chưa chắc
const RUSH_SEC = 3; // sai mà nhanh hơn mức này -> bấm bừa

const parentOf = (id) => TREE[id].parent;
const childrenOf = (id) => Object.values(TREE).filter((n) => n.parent === id);
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function load() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  } catch {
    return null;
  }
}
function save(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {}
}

const BLANK = {
  stage: 'home',
  records: [], // quiz: {node, sel, correct, sec, flag}
  target: null,
  round: 0,
  retry: 0,
  roundRecs: [], // kết quả vòng chẩn đoán vừa xong
  decision: null, // escalate | locate | restart
  nextTarget: null,
  trace: [],
  status: {}, // nodeId -> 'ok' | 'shaky' | 'weak' | 'probing'
  verdict: null, // located | restart | self
};

// flag: ok | slow (đúng nhưng chậm) | wrong | rush (sai rất nhanh) | skip (bỏ trống)
function grade(items, picked, times) {
  return items.map((q, i) => {
    const sel = picked[i];
    const blank = sel === undefined || sel === null;
    const correct = !blank && sel === q.answer;
    const sec = times[i] || 0;
    const flag = blank ? 'skip' : correct ? (sec > SLOW_SEC ? 'slow' : 'ok') : sec < RUSH_SEC ? 'rush' : 'wrong';
    return { node: q.node, sel: blank ? null : sel, correct, sec, flag };
  });
}

const FLAG_TEXT = {
  ok: null,
  slow: 'đúng nhưng chậm — chưa chắc',
  wrong: 'sai',
  rush: 'sai rất nhanh — có thể bấm bừa',
  skip: 'bỏ trống',
};

function App() {
  const [s, setS] = useState(BLANK);
  const [saved, setSaved] = useState(load());
  const [busy, setBusy] = useState(null);

  const go = (next) => {
    const merged = { ...s, ...next };
    setS(merged);
    save(merged);
    setSaved(merged);
  };

  // ponytail: delay giả để người xem kịp thấy hệ thống "đang nghĩ" — bỏ khi nối AI thật
  const think = (lines, next, ms = 1800) => {
    setBusy(lines);
    setTimeout(() => {
      setBusy(null);
      go(next);
    }, ms);
  };

  const reset = () => {
    localStorage.removeItem(SAVE_KEY);
    setSaved(null);
    setS(BLANK);
  };

  return (
    <div className="shell">
      <Header onReset={reset} />
      <div className="layout">
        <main className="panel">
          {busy ? (
            <Thinking lines={busy} />
          ) : (
            <>
              {s.stage === 'home' && <Home saved={saved} go={go} setS={setS} />}
              {s.stage === 'quiz' && <Quiz go={go} />}
              {s.stage === 'result' && <Result s={s} go={go} think={think} />}
              {s.stage === 'explain' && <Explain s={s} go={go} think={think} />}
              {s.stage === 'probe' && <Probe s={s} think={think} />}
              {s.stage === 'review' && <Review s={s} go={go} think={think} />}
              {s.stage === 'plan' && <Plan s={s} go={go} />}
            </>
          )}
        </main>
        <aside className="side">
          <TreeView status={s.status} target={s.stage === 'probe' ? s.target : null} />
          <Why trace={s.trace} />
        </aside>
      </div>
    </div>
  );
}

function Thinking({ lines }) {
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(x + 1, lines.length)), 500);
    return () => clearInterval(t);
  }, [lines]);
  return (
    <section className="think">
      <div className="spinner" />
      <h2>Đang phân tích…</h2>
      <ul className="steps">
        {lines.slice(0, n).map((l, i) => (
          <li key={i}>
            {i === n - 1 ? '⋯' : '✓'} {l}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Header({ onReset }) {
  return (
    <header className="head">
      <div className="brand">
        <span className="cup">☕</span>
        <div>
          <h1>ColdBrew</h1>
          <p>Ôn đúng chỗ hổng, không ôn lại cả chương</p>
        </div>
      </div>
      <div className="head-right">
        <span className="badge">MOCK DATA · chưa nối AI</span>
        <button className="ghost" onClick={onReset}>
          Xoá phiên
        </button>
      </div>
    </header>
  );
}

function Home({ saved, go, setS }) {
  return (
    <section>
      <h2>Bài ôn: {TREE.root.label}</h2>
      <p className="muted">
        5 câu, mỗi màn một câu. Không chắc thì bấm tiếp để bỏ qua — hệ thống ghi lại cả thời gian
        trả lời và dùng nó khi chẩn đoán.
      </p>
      <div className="row">
        <button className="primary" onClick={() => go({ ...BLANK, stage: 'quiz' })}>
          Bắt đầu quiz
        </button>
        {saved && saved.stage !== 'home' && (
          <button className="ghost" onClick={() => setS(saved)}>
            Tiếp tục phiên trước ({labelOfStage(saved.stage)})
          </button>
        )}
      </div>
      <Source node={TREE.root} />
    </section>
  );
}

const labelOfStage = (st) =>
  ({
    quiz: 'đang làm quiz',
    result: 'đã có kết quả',
    explain: 'đang xem giải thích đáp án',
    probe: 'đang chẩn đoán',
    review: 'đang xem kết quả vòng chẩn đoán',
    plan: 'đã có lộ trình',
  }[st] || st);

/* ---------- chạy bộ câu hỏi: mỗi màn một câu, đếm giờ, cho bỏ qua ---------- */

function Runner({ items, name, source, onDone, submitLabel }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState({});
  const [times, setTimes] = useState({});
  const [, tick] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const commit = () => {
    const sec = Math.round((Date.now() - startRef.current) / 1000);
    const next = { ...times, [i]: (times[i] || 0) + sec };
    setTimes(next);
    startRef.current = Date.now();
    return next;
  };
  const move = (d) => {
    commit();
    setI(i + d);
  };

  const q = items[i];
  const live = (times[i] || 0) + Math.round((Date.now() - startRef.current) / 1000);
  const last = i === items.length - 1;

  return (
    <div>
      <div className="progress">
        {items.map((_, j) => (
          <span key={j} className={'pip' + (j === i ? ' now' : picked[j] !== undefined ? ' done' : '')} />
        ))}
        <span className="timer">⏱ {fmt(live)}</span>
      </div>

      <div className="card">
        <p className="q">
          <b>
            Câu {i + 1}/{items.length}.
          </b>{' '}
          {q.q}
        </p>
        {q.options.map((o, j) => (
          <label key={j} className={'opt' + (picked[i] === j ? ' on' : '')}>
            <input
              type="radio"
              name={name + i}
              checked={picked[i] === j}
              onChange={() => setPicked({ ...picked, [i]: j })}
            />
            {o}
          </label>
        ))}
        {picked[i] === undefined ? (
          <p className="hint">Chưa chọn — bấm tiếp là bỏ qua câu này.</p>
        ) : (
          <button
            className="link"
            onClick={() => {
              const p = { ...picked };
              delete p[i];
              setPicked(p);
            }}
          >
            Bỏ chọn
          </button>
        )}
        {source && <Source node={source} />}
      </div>

      <div className="row">
        <button className="ghost" disabled={i === 0} onClick={() => move(-1)}>
          ← Trước
        </button>
        {last ? (
          <button className="primary" onClick={() => onDone(picked, commit())}>
            {submitLabel}
          </button>
        ) : (
          <button className="primary" onClick={() => move(1)}>
            {picked[i] === undefined ? 'Bỏ qua →' : 'Câu tiếp →'}
          </button>
        )}
      </div>
    </div>
  );
}

/* bảng đáp án dùng chung cho màn kết quả quiz và màn xem lại vòng chẩn đoán */
function Answers({ items, recs, sourceOf }) {
  return items.map((q, i) => {
    const r = recs[i];
    const cls = r.correct ? (r.flag === 'slow' ? 'shaky' : 'ok') : 'bad';
    return (
      <div className={'card ' + cls} key={i}>
        <p className="q">
          <b>
            {r.correct ? '✓' : r.flag === 'skip' ? '–' : '✕'} Câu {i + 1}.
          </b>{' '}
          {q.q}
          <span className="time-chip">⏱ {fmt(r.sec)}</span>
        </p>
        <p className="muted">
          {r.sel === null ? (
            <i>bỏ trống</i>
          ) : (
            <>
              Bạn chọn: <i>{q.options[r.sel]}</i>
            </>
          )}
          {!r.correct && (
            <>
              {' '}
              · Đáp án: <b>{q.options[q.answer]}</b>
            </>
          )}
        </p>
        {FLAG_TEXT[r.flag] && <p className={'flag ' + r.flag}>⚑ {FLAG_TEXT[r.flag]}</p>}
        {sourceOf && <Source node={sourceOf(i)} />}
      </div>
    );
  });
}

/* ---------- quiz ---------- */

function Quiz({ go }) {
  const done = (picked, times) => {
    const records = grade(QUIZ, picked, times);
    const status = {};
    records.forEach((r) => (status[r.node] = r.correct ? (r.flag === 'slow' ? 'shaky' : 'ok') : 'weak'));
    go({ stage: 'result', records, status });
  };
  return (
    <section>
      <h2>Quiz ôn tập</h2>
      <Runner items={QUIZ} name="q" onDone={done} submitLabel="Nộp bài" />
    </section>
  );
}

const weakSignals = (records) => {
  const missed = records.filter((r) => !r.correct); // sai + bỏ trống
  const shaky = records.filter((r) => r.flag === 'slow');
  return { missed, shaky, candidates: missed.length ? missed : shaky };
};

// dùng chung cho nút ở màn kết quả và ở màn giải thích
function startDiagnosis(s, think) {
  const { missed, shaky, candidates } = weakSignals(s.records);
  const byParent = {};
  candidates.forEach((r) => {
    const p = parentOf(r.node);
    (byParent[p] = byParent[p] || []).push(r);
  });
  const target = Object.keys(byParent).sort((a, b) => byParent[b].length - byParent[a].length)[0];

  const trace = [...s.trace];
  if (missed.length)
    trace.push({
      t: 'Sai / bỏ trống',
      d: missed.map((r) => `${TREE[r.node].label} (${FLAG_TEXT[r.flag]}, ${fmt(r.sec)})`).join(' · '),
    });
  if (shaky.length)
    trace.push({
      t: 'Đúng nhưng chậm',
      d: shaky.map((r) => `${TREE[r.node].label} (${fmt(r.sec)} > ${SLOW_SEC}s)`).join(' · '),
    });
  if (!missed.length)
    trace.push({ t: 'Không có câu sai', d: 'Lấy các câu trả lời chậm làm tín hiệu chẩn đoán' });
  trace.push({
    t: 'Định vị',
    d: `${byParent[target].length} tín hiệu cùng thuộc "${TREE[target].label}" → hỏi 3 câu nền của mục này`,
  });

  think(
    [
      `Đọc ${s.records.length} câu trả lời và thời gian làm từng câu`,
      `Gắn ${candidates.length} tín hiệu yếu về các node trên cây tri thức`,
      `Chọn phần nền cần kiểm tra: ${TREE[target].label}`,
    ],
    { stage: 'probe', target, round: 1, retry: 0, trace, status: { ...s.status, [target]: 'probing' } },
  2000
  );
}

function Result({ s, go, think }) {
  const correct = s.records.filter((r) => r.correct).length;
  const { candidates } = weakSignals(s.records);

  const explain = () =>
    think(
      [
        `Đọc ${s.records.length} câu và phương án bạn đã chọn`,
        'Tra nội dung gốc của từng câu trên slide',
        'Soạn giải thích cho đáp án đúng và bẫy của phương án bạn chọn',
      ],
      {
        stage: 'explain',
        trace: [...s.trace, { t: 'Học viên chọn', d: 'Xem giải thích đáp án trước khi chẩn đoán' }],
      },
      2000
    );

  return (
    <section>
      <h2>
        Kết quả: {correct}/{s.records.length} · tổng {fmt(s.records.reduce((a, r) => a + r.sec, 0))}
      </h2>
      <Answers items={QUIZ} recs={s.records} sourceOf={(i) => TREE[s.records[i].node]} />
      {candidates.length ? (
        <>
          <h3>Bạn muốn làm gì tiếp?</h3>
          <div className="row">
            <button className="primary" onClick={explain}>
              ✨ Giải thích đáp án
            </button>
            <button className="ghost" onClick={() => startDiagnosis(s, think)}>
              🔍 Tìm phần nền bị hổng
            </button>
          </div>
          <p className="hint">
            Xem giải thích trước rồi vẫn đi chẩn đoán được — giải thích nói bạn sai <i>cái gì</i>,
            chẩn đoán tìm <i>phần nền</i> khiến bạn sai.
          </p>
        </>
      ) : (
        <p className="good">Đúng hết và trả lời dứt khoát — không cần ôn thêm.</p>
      )}
    </section>
  );
}

/* màn giải thích đáp án — tính năng AI thứ hai, độc lập với chẩn đoán */
function Explain({ s, go, think }) {
  return (
    <section>
      <h2>Giải thích đáp án</h2>
      <p className="muted">Giải thích bám theo nội dung slide của từng câu, không thêm khái niệm ngoài bài.</p>
      {s.records.map((r, i) => {
        const q = QUIZ[i];
        const e = EXPLAIN[r.node] || {};
        const trap = r.sel !== null && !r.correct ? (e.traps || {})[r.sel] : null;
        return (
          <div className={'card ' + (r.correct ? 'ok' : 'bad')} key={i}>
            <p className="q">
              <b>
                {r.correct ? '✓' : r.flag === 'skip' ? '–' : '✕'} Câu {i + 1}.
              </b>{' '}
              {q.q}
            </p>
            <p className="muted">
              Đáp án đúng: <b>{q.options[q.answer]}</b>
              {r.sel !== null && !r.correct && (
                <>
                  {' '}
                  · bạn chọn: <i>{q.options[r.sel]}</i>
                </>
              )}
              {r.sel === null && (
                <>
                  {' '}
                  · <i>bạn bỏ trống câu này</i>
                </>
              )}
            </p>
            <p>{e.why}</p>
            {trap && <p className="flag wrong">⚑ Bẫy: {trap}</p>}
            {r.flag === 'slow' && (
              <p className="flag slow">⚑ Đúng nhưng mất {fmt(r.sec)} — nên đọc lại phần này cho chắc.</p>
            )}
            <Source node={TREE[r.node]} />
          </div>
        );
      })}
      <div className="row">
        <button className="primary" onClick={() => startDiagnosis(s, think)}>
          🔍 Tìm phần nền bị hổng →
        </button>
        <button className="ghost" onClick={() => go({ stage: 'result' })}>
          ← Về bảng kết quả
        </button>
      </div>
    </section>
  );
}

/* ---------- chẩn đoán: mỗi vòng dừng lại cho học viên quyết ---------- */

function Probe({ s, think }) {
  const qs = PROBES[s.target] || [];
  const node = TREE[s.target];

  const done = (picked, times) => {
    const recs = grade(qs, picked, times);
    const bad = recs.filter((r) => !r.correct).length; // bỏ trống tính như chưa nắm
    const slow = recs.filter((r) => r.flag === 'slow').length;
    const up = parentOf(s.target);

    let decision, nextTarget = null;
    if (bad <= 1) decision = 'locate';
    else if (!up || up === 'root' || s.round + 1 > MAX_ROUNDS || !PROBES[up]) decision = 'restart';
    else {
      decision = 'escalate';
      nextTarget = up;
    }

    const trace = [
      ...s.trace,
      {
        t: `Vòng ${s.round}${s.retry ? ` (làm lại lần ${s.retry})` : ''} · ${node.label}`,
        d: `sai/bỏ trống ${bad}/${qs.length}${slow ? `, ${slow} câu đúng nhưng chậm` : ''}, ${fmt(
          recs.reduce((a, r) => a + r.sec, 0)
        )}`,
      },
    ];

    const conclusion = {
      locate: `Nền vẫn nắm được → chỗ hổng khu trú ở "${node.label}"`,
      escalate: `Vẫn hổng ở tầng này → đề nghị kiểm tra tiếp "${nextTarget ? TREE[nextTarget].label : ''}"`,
      restart: 'Sai cả ở tầng nền và đã chạm giới hạn leo cây',
    }[decision];

    think([`Chấm ${qs.length} câu nền của "${node.label}"`, 'Đối chiếu với cây tri thức', conclusion], {
      stage: 'review',
      roundRecs: recs,
      decision,
      nextTarget,
      trace,
      status: { ...s.status, [s.target]: 'weak' },
    });
  };

  return (
    <section key={s.target + '-' + s.retry}>
      <h2>
        Chẩn đoán · vòng {s.round}
        {s.retry ? ` · làm lại lần ${s.retry}` : ''}
      </h2>
      <p className="muted">
        Đang kiểm tra phần nền: <b>{node.label}</b>
      </p>
      <Runner
        items={qs}
        name={'p' + s.round + '-' + s.retry}
        source={node}
        onDone={done}
        submitLabel="Kiểm tra"
      />
    </section>
  );
}

/* màn chờ giữa hai vòng: phân tích xong, học viên chọn đi tiếp / làm lại / tự ôn */
function Review({ s, go, think }) {
  const node = TREE[s.target];
  const qs = PROBES[s.target] || [];
  const bad = s.roundRecs.filter((r) => !r.correct).length;
  const skipped = s.roundRecs.filter((r) => r.flag === 'skip').length;
  const [fb, setFb] = useState(null); // null | 'loading' | 'shown'

  const askFeedback = () => {
    setFb('loading');
    setTimeout(() => {
      setFb('shown');
      go({ trace: [...s.trace, { t: 'Học viên chọn', d: `Xem giải thích đáp án vòng ${s.round}` }] });
    }, 1400);
  };

  const analysis = {
    locate: `Bạn nắm được phần nền của "${node.label}" (chỉ sai ${bad}/${qs.length}). Chỗ hổng nằm đúng ở mục này, không cần kiểm tra lên tầng trên nữa.`,
    escalate: `Bạn sai ${bad}/${qs.length} câu nền của "${node.label}"${
      skipped ? ` (trong đó ${skipped} câu bỏ trống)` : ''
    }. Dấu hiệu là chỗ hổng nằm sâu hơn một tầng, ở "${s.nextTarget ? TREE[s.nextTarget].label : ''}".`,
    restart: `Bạn sai ${bad}/${qs.length} câu ngay ở tầng nền và đã đi hết số vòng cho phép. Hệ thống không khoanh nhỏ hơn được nữa.`,
  }[s.decision];

  const retry = () =>
    go({
      stage: 'probe',
      retry: (s.retry || 0) + 1,
      trace: [
        ...s.trace,
        { t: 'Học viên chọn', d: `Làm lại vòng ${s.round} · ${node.label}` },
      ],
    });

  const selfStudy = () =>
    go({
      stage: 'plan',
      verdict: 'self',
      trace: [
        ...s.trace,
        { t: 'Học viên chọn', d: 'Tự ôn — dừng chẩn đoán tại đây, không đi tiếp lên tầng trên' },
      ],
    });

  const next = () => {
    const up = s.nextTarget;
    think(
      [`Lấy câu hỏi nền của "${TREE[up].label}"`, `Nguồn: ${TREE[up].page}`],
      {
        stage: 'probe',
        target: up,
        round: s.round + 1,
        retry: 0,
        trace: [...s.trace, { t: 'Leo lên', d: `Học viên đồng ý kiểm tra tiếp "${TREE[up].label}"` }],
        status: { ...s.status, [up]: 'probing' },
      },
      1200
    );
  };

  return (
    <section>
      <h2>Kết quả vòng {s.round}</h2>
      <Answers items={qs} recs={s.roundRecs} />

      <div className={'card ' + (s.decision === 'locate' ? 'ok' : 'bad')}>
        <h3>Hệ thống đọc được gì</h3>
        <p>{analysis}</p>
        <Source node={node} />
      </div>

      {fb === null && (
        <button className="ghost wide" onClick={askFeedback}>
          ✨ Nhận xét &amp; giải thích đáp án vòng này
        </button>
      )}
      {fb === 'loading' && (
        <p className="inline-load">
          <span className="spinner sm" /> Đang soạn nhận xét cho vòng {s.round}…
        </p>
      )}
      {fb === 'shown' && <RoundFeedback s={s} node={node} qs={qs} bad={bad} skipped={skipped} />}

      <h3>Bạn muốn làm gì tiếp?</h3>
      <div className="row">
        {s.decision === 'escalate' && (
          <button className="primary" onClick={next}>
            Kiểm tra tiếp "{TREE[s.nextTarget].label}" →
          </button>
        )}
        {s.decision === 'locate' && (
          <button className="primary" onClick={() => go({ stage: 'plan', verdict: 'located' })}>
            Xem lộ trình ôn →
          </button>
        )}
        {s.decision === 'restart' && (
          <button className="primary" onClick={() => go({ stage: 'plan', verdict: 'restart' })}>
            Xem tóm tắt cả bài →
          </button>
        )}
        <button className="ghost" onClick={retry}>
          ↻ Làm lại vòng này
        </button>
        {s.decision === 'escalate' && (
          <button className="ghost" onClick={selfStudy}>
            Mình tự ôn được — xem lộ trình
          </button>
        )}
      </div>
      <p className="hint">
        Làm lại không xoá dấu vết: mọi lần làm đều được ghi vào phần "vì sao bạn nhận lộ trình này".
      </p>
    </section>
  );
}

/* nhận xét + giải thích cho một vòng chẩn đoán (AI #1 áp vào tầng đang đứng) */
function RoundFeedback({ s, node, qs, bad, skipped }) {
  const slow = s.roundRecs.filter((r) => r.flag === 'slow').length;
  const rush = s.roundRecs.filter((r) => r.flag === 'rush').length;
  const why = PROBE_WHY[s.target] || [];

  const notes = [];
  if (bad === 0) notes.push(`Bạn trả lời đúng cả ${qs.length} câu nền của "${node.label}".`);
  else notes.push(`Bạn sai ${bad}/${qs.length} câu nền của "${node.label}".`);
  if (skipped) notes.push(`${skipped} câu bỏ trống — bỏ trống cũng được tính là chưa nắm.`);
  if (rush) notes.push(`${rush} câu trả lời dưới ${RUSH_SEC}s: nhanh hơn thời gian đọc xong đề.`);
  if (slow) notes.push(`${slow} câu đúng nhưng trên ${SLOW_SEC}s — biết nhưng chưa chắc.`);
  notes.push(
    s.decision === 'locate'
      ? 'Phần nền ổn, nên chỗ cần ôn là chính mục này chứ không phải cả chương.'
      : s.decision === 'escalate'
      ? 'Sai ngay ở mức nền của mục này, nên nhiều khả năng vấn đề nằm ở tầng trên.'
      : 'Sai ở mức nền nhất của bài — nên xem lại cả bài thay vì vá từng mục.'
  );

  return (
    <div className="card shaky">
      <h3>Nhận xét</h3>
      <p>{notes.join(' ')}</p>
      <h3>Giải thích từng câu</h3>
      {qs.map((q, i) => {
        const r = s.roundRecs[i];
        return (
          <div className="mini" key={i}>
            <p className="q">
              <b>
                {r.correct ? '✓' : r.flag === 'skip' ? '–' : '✕'} {i + 1}.
              </b>{' '}
              {q.q}
            </p>
            <p className="muted">
              Đáp án đúng: <b>{q.options[q.answer]}</b>
              {r.sel !== null && !r.correct && (
                <>
                  {' '}
                  · bạn chọn: <i>{q.options[r.sel]}</i>
                </>
              )}
              {r.sel === null && <> · <i>bỏ trống</i></>}
            </p>
            <p>{why[i]}</p>
          </div>
        );
      })}
      <Source node={node} />
    </div>
  );
}

/* ---------- lộ trình ---------- */

function Plan({ s, go }) {
  const node = TREE[s.target];
  const restart = s.verdict === 'restart';
  return (
    <section>
      <h2>{restart ? 'Nên học lại bài này từ đầu' : `Lộ trình ôn: ${node.label}`}</h2>

      {restart ? (
        <div className="card bad">
          <p>Bạn sai cả ở phần nền, không chỉ ở chi tiết. Tóm tắt nhanh cả bài trước khi làm lại quiz:</p>
          <ul>
            {TREE.root.compact.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <Source node={TREE.root} />
        </div>
      ) : (
        <div className="card ok">
          <ul>
            {(REVIEW[s.target] || []).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <Source node={node} />
        </div>
      )}

      {s.verdict === 'self' && (
        <p className="hint">
          Bạn chọn tự ôn nên hệ thống dừng ở mức "{node.label}" — chỗ hổng có thể còn nằm sâu hơn một
          tầng. Làm lại quiz sau khi ôn để kiểm tra.
        </p>
      )}

      <div className="card">
        <h3>Vì sao bạn nhận lộ trình này</h3>
        <ol className="trace">
          {s.trace.map((t, i) => (
            <li key={i}>
              <b>{t.t}:</b> {t.d}
            </li>
          ))}
        </ol>
        <p className="muted">
          Mọi câu hỏi và nội dung ôn ở trên đều gắn với một node có nguồn slide — không sinh thêm nội
          dung mới.
        </p>
      </div>

      <button className="ghost" onClick={() => go({ stage: 'home' })}>
        Về đầu
      </button>
    </section>
  );
}

/* ---------- cột phải ---------- */

function TreeView({ status, target }) {
  const render = (id, depth) => {
    const kids = childrenOf(id);
    const st = id === target ? 'probing' : status[id];
    return (
      <li key={id} className={'tn ' + (st || '')} style={{ marginLeft: depth * 12 }}>
        <span className="dot" /> {TREE[id].label}
        {kids.length > 0 && <ul>{kids.map((k) => render(k.id, depth + 1))}</ul>}
      </li>
    );
  };
  return (
    <div className="box">
      <h3>Cây tri thức</h3>
      <ul className="tree">{render('root', 0)}</ul>
      <p className="legend">
        <span className="dot probing" /> đang hỏi <span className="dot weak" /> hổng{' '}
        <span className="dot shaky" /> chưa chắc <span className="dot ok" /> ổn
      </p>
    </div>
  );
}

function Why({ trace }) {
  if (!trace.length) return null;
  return (
    <div className="box">
      <h3>Dấu vết quyết định</h3>
      <ol className="trace">
        {trace.map((t, i) => (
          <li key={i}>
            <b>{t.t}:</b> {t.d}
          </li>
        ))}
      </ol>
    </div>
  );
}

const Source = ({ node }) => <p className="src">📄 {node.page}</p>;

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

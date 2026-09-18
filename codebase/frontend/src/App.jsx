import React, { useState, useEffect, useRef } from 'react';
import {
  apiGetHealth,
  apiGetTree,
  apiGetQuiz,
  apiGradeQuiz,
  apiExplainSingle,
  apiExplainRound,
  apiChatMessage,
  apiGetProbes,
  apiEvaluateRound,
  apiGetHypothesis,
  apiGeneratePlan,
} from './api';

const SAVE_KEY = 'coldbrew-live-session';
const SLOW_SEC = 25;
const RUSH_SEC = 3;
const MAX_ROUNDS = 3;

// Dữ liệu Cây tri thức mặc định dự phòng
const DEFAULT_TREE = {
  root: {
    id: 'root',
    label: 'Day 1 · AI & LLM Foundation',
    page: 'Slide d1 · trang 1–29',
    parent: null,
    compact: [
      'LLM sinh văn bản bằng cách đoán token kế tiếp, không tra cứu dữ liệu (trang 4–9)',
      'Prompt là cách ta đặt ràng buộc cho phần sinh đó (trang 12–18)',
      'RAG gắn thêm nguồn ngoài để câu trả lời có căn cứ (trang 20–27)',
    ],
  },
  c1: { id: 'c1', label: 'Chương 1 · LLM hoạt động thế nào', page: 'Slide d1 · trang 4–11', parent: 'root' },
  c1s1: { id: 'c1s1', label: '1.1 Token & tokenization', page: 'Slide d1 · trang 5–6', parent: 'c1' },
  c1s2: { id: 'c1s2', label: '1.2 Sinh văn bản tự hồi quy', page: 'Slide d1 · trang 8–9', parent: 'c1' },
  c2: { id: 'c2', label: 'Chương 2 · Prompting', page: 'Slide d1 · trang 12–18', parent: 'root' },
  c2s1: { id: 'c2s1', label: '2.1 Cấu trúc một prompt', page: 'Slide d1 · trang 13', parent: 'c2' },
  c2s2: { id: 'c2s2', label: '2.2 Few-shot', page: 'Slide d1 · trang 16–17', parent: 'c2' },
  c3: { id: 'c3', label: 'Chương 3 · RAG', page: 'Slide d1 · trang 20–27', parent: 'root' },
  c3s1: { id: 'c3s1', label: '3.1 Embedding', page: 'Slide d1 · trang 21–22', parent: 'c3' },
  c3s2: { id: 'c3s2', label: '3.2 Retrieval top-k', page: 'Slide d1 · trang 25', parent: 'c3' },
  l_token: { id: 'l_token', label: 'Token không phải là từ', page: 'Slide d1 · trang 5', parent: 'c1s1' },
  l_ctx: { id: 'l_ctx', label: 'Context window đếm bằng token', page: 'Slide d1 · trang 6', parent: 'c1s1' },
  l_next: { id: 'l_next', label: 'Mô hình đoán token kế tiếp', page: 'Slide d1 · trang 8', parent: 'c1s2' },
  l_temp: { id: 'l_temp', label: 'Temperature đổi độ ngẫu nhiên', page: 'Slide d1 · trang 9', parent: 'c1s2' },
  l_role: { id: 'l_role', label: 'Role · Context · Task', page: 'Slide d1 · trang 13', parent: 'c2s1' },
  l_shot: { id: 'l_shot', label: 'Ví dụ mẫu định hình đầu ra', page: 'Slide d1 · trang 16', parent: 'c2s2' },
  l_vec: { id: 'l_vec', label: 'Văn bản được vector hoá', page: 'Slide d1 · trang 21', parent: 'c3s1' },
  l_cos: { id: 'l_cos', label: 'Gần nhau về ngữ nghĩa = cosine cao', page: 'Slide d1 · trang 22', parent: 'c3s1' },
  l_topk: { id: 'l_topk', label: 'Lấy top-k đoạn liên quan nhất', page: 'Slide d1 · trang 25', parent: 'c3s2' },
};

const DEFAULT_QUIZ = [
  {
    id: 'q1',
    node: 'l_token',
    q: 'Câu nào đúng về token?',
    options: ['Mỗi token luôn là một từ', 'Một từ dài có thể bị tách thành nhiều token', 'Token là một câu hoàn chỉnh', 'Token chỉ dùng cho tiếng Anh'],
    answer: 1,
    why: 'Tokenizer cắt theo mẫu ký tự hay gặp, nên một từ dài có thể thành nhiều token, còn từ ngắn thông dụng chỉ một token. Tiếng Việt có dấu thường tốn nhiều token hơn tiếng Anh.',
    traps: { 0: 'Nhầm "token = từ" — nhầm phổ biến nhất, và kéo theo tính sai context window.', 2: 'Câu là đơn vị lớn hơn token rất nhiều.', 3: 'Tokenizer làm việc với mọi ngôn ngữ.' },
  },
  {
    id: 'q2',
    node: 'l_ctx',
    q: 'Context window của mô hình đếm bằng gì?',
    options: ['Số token', 'Số câu', 'Số ký tự hiển thị trên màn hình', 'Số lần gọi API'],
    answer: 0,
    why: 'Context window là giới hạn tính bằng token cho cả phần bạn nhập lẫn phần mô hình sinh ra — vượt giới hạn thì phải cắt bớt hoặc chia nhỏ.',
    traps: { 1: 'Câu không phải đơn vị mô hình làm việc.', 2: 'Ký tự khác token.', 3: 'Số lần gọi API là hạn mức dịch vụ.' },
  },
  {
    id: 'q3',
    node: 'l_shot',
    q: 'Few-shot prompting nghĩa là gì?',
    options: ['Hỏi thật ngắn', 'Đưa vài ví dụ mẫu vào prompt', 'Chạy mô hình vài lần rồi lấy trung bình', 'Giảm số token đầu ra'],
    answer: 1,
    why: 'Few-shot là đặt sẵn vài cặp ví dụ vào trong prompt để mô hình bắt chước định dạng và cách trả lời.',
    traps: { 0: 'Độ dài prompt không phải điểm mấu chốt.', 2: 'Chạy nhiều lần lấy phổ biến nhất là self-consistency.', 3: 'Thêm ví dụ làm prompt dài ra.' },
  },
  {
    id: 'q4',
    node: 'l_cos',
    q: 'Hai đoạn văn có nghĩa gần nhau thì vector của chúng?',
    options: ['Có cosine similarity cao', 'Có độ dài bằng nhau', 'Có cùng số chiều nhưng ngược dấu', 'Không liên quan gì'],
    answer: 0,
    why: 'Embedding đặt các đoạn gần nghĩa vào vùng gần nhau trong không gian vector; mức gần đó đo bằng cosine similarity.',
    traps: { 1: 'Mọi vector từ cùng một model đều cùng số chiều.', 2: 'Ngược dấu là nghĩa trái nhau.', 3: 'Đây là cơ chế tìm kiếm trong RAG.' },
  },
  {
    id: 'q5',
    node: 'l_vec',
    q: 'Để máy so được nghĩa của hai đoạn văn, bước đầu tiên là?',
    options: ['Vector hoá (embedding) hai đoạn', 'Dịch cả hai sang tiếng Anh', 'Tóm tắt lại cho ngắn', 'Đếm số từ trùng nhau'],
    answer: 0,
    why: 'Máy không so nghĩa trực tiếp trên chữ: phải đưa hai đoạn qua model embedding thành vector rồi mới đo được độ gần.',
    traps: { 1: 'Không cần dịch — model embedding đa ngữ so được trực tiếp.', 2: 'Tóm tắt làm mất thông tin.', 3: 'Đếm từ trùng là tìm từ khoá.' },
  },
];

const DEFAULT_REVIEW = {
  c3s1: ['Xem lại slide d1 trang 21–22: từ văn bản → vector', 'Làm lại 2 ví dụ so sánh cosine ở trang 22'],
  c3s2: ['Xem lại slide d1 trang 25: chọn top-k thế nào'],
  c3: ['Xem lại cả chương 3 (trang 20–27) theo thứ tự: embedding → retrieval → generation'],
  c1s1: ['Xem lại slide d1 trang 5–6 và thử tokenize một câu tiếng Việt'],
  c1s2: ['Xem lại slide d1 trang 8–9: vòng lặp đoán token + temperature'],
  c1: ['Xem lại chương 1 (trang 4–11) trước khi quay lại chương 3'],
  c2s1: ['Xem lại slide d1 trang 13: ba phần của một prompt'],
  c2s2: ['Xem lại slide d1 trang 16–17 và viết thử một prompt few-shot'],
  c2: ['Xem lại chương 2 (trang 12–18)'],
};

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const FLAG_TEXT = {
  ok: null,
  slow: 'đúng nhưng chậm — chưa chắc',
  wrong: 'sai',
  rush: 'sai rất nhanh — có thể bấm bừa',
  skip: 'bỏ trống',
};

const BLANK = {
  stage: 'home',
  records: [], // quiz: {node, sel, correct, sec, flag, answer, why, trap}
  target: null,
  round: 0,
  retry: 0,
  hits: [],
  roundRecs: [],
  decision: null,
  nextTarget: null,
  trace: [],
  status: {},
  verdict: null,
};

function weakSignals(records) {
  const missed = records.filter((r) => !r.correct);
  const shaky = records.filter((r) => r.flag === 'slow');
  return { missed, shaky, candidates: missed.length ? missed : shaky };
}

function pickTarget(records, tree) {
  const { missed, shaky, candidates } = weakSignals(records);
  if (!candidates.length) return { target: null, hits: [], missed, shaky };

  const order = [];
  const byParent = {};
  candidates.forEach((r) => {
    const p = (tree[r.node] || {}).parent;
    if (p) {
      if (!byParent[p]) {
        byParent[p] = [];
        order.push(p);
      }
      byParent[p].push(r);
    }
  });
  if (!order.length) return { target: null, hits: [], missed, shaky };
  const target = order.reduce((best, p) => (byParent[p].length > byParent[best].length ? p : best));
  return { target, hits: byParent[target].map((r) => r.node), missed, shaky };
}

export default function App() {
  const [s, setS] = useState(BLANK);
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [tree, setTree] = useState(DEFAULT_TREE);
  const [quizList, setQuizList] = useState(DEFAULT_QUIZ);

  useEffect(() => {
    apiGetHealth().then((res) => {
      if (res && res.ok) setIsOnline(true);
    });
    apiGetTree().then((res) => {
      if (res && res.nodes) setTree(res.nodes);
    });
    apiGetQuiz().then((res) => {
      if (res && res.length > 0) setQuizList(res);
    });
    try {
      const local = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (local) setSaved(local);
    } catch {}
  }, []);

  const go = (next) => {
    const merged = { ...s, ...next };
    setS(merged);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(merged));
    } catch {}
    setSaved(merged);
  };

  const think = (lines, next, ms = 1500) => {
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
      <Header onReset={reset} isOnline={isOnline} />
      <div className="layout">
        <main className="panel">
          {busy ? (
            <Thinking lines={busy} />
          ) : (
            <>
              {s.stage === 'home' && <Home saved={saved} go={go} setS={setS} tree={tree} />}
              {s.stage === 'quiz' && <Quiz go={go} quizList={quizList} />}
              {s.stage === 'result' && <Result s={s} go={go} think={think} tree={tree} quizList={quizList} />}
              {s.stage === 'explain' && <Explain s={s} go={go} think={think} tree={tree} quizList={quizList} />}
              {s.stage === 'analysis' && <Analysis s={s} go={go} think={think} tree={tree} />}
              {s.stage === 'probe' && <Probe s={s} think={think} tree={tree} />}
              {s.stage === 'review' && <Review s={s} go={go} think={think} tree={tree} />}
              {s.stage === 'plan' && <Plan s={s} go={go} tree={tree} />}
            </>
          )}
        </main>
        <aside className="side">
          <TreeView
            tree={tree}
            status={s.status}
            target={s.stage === 'probe' || s.stage === 'analysis' ? s.target : null}
          />
          <Why trace={s.trace} />
        </aside>
      </div>
    </div>
  );
}

function Thinking({ lines }) {
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(x + 1, lines.length)), 450);
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

function Header({ onReset, isOnline }) {
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
        <span className={'badge ' + (isOnline ? 'online' : '')}>
          {isOnline ? '● Live Backend API v0' : 'MOCK DATA · chưa kết nối BE'}
        </span>
        <button className="ghost" onClick={onReset}>
          Xoá phiên
        </button>
      </div>
    </header>
  );
}

function Home({ saved, go, setS, tree }) {
  const rootNode = tree.root || DEFAULT_TREE.root;
  return (
    <section>
      <h2>Bài ôn: {rootNode.label}</h2>
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
      <Source node={rootNode} />
    </section>
  );
}

const labelOfStage = (st) =>
  ({
    quiz: 'đang làm quiz',
    result: 'đã có kết quả',
    explain: 'đang xem giải thích đáp án',
    analysis: 'đang xem phân tích của AI',
    probe: 'đang chẩn đoán',
    review: 'đang xem kết quả vòng chẩn đoán',
    plan: 'đã có lộ trình',
  }[st] || st);

/* ---------- Runner: mỗi màn một câu, đếm giờ, cho bỏ qua ---------- */
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
    const sec = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
    const next = { ...times, [i]: (times[i] || 0) + sec };
    setTimes(next);
    startRef.current = Date.now();
    return next;
  };

  const move = (d) => {
    commit();
    setI(i + d);
  };

  const q = items[i] || {};
  const live = (times[i] || 0) + Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
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
        {(q.options || []).map((o, j) => (
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

/* ---------- Answers & AnswerCard (dùng chung cho Result và Review) ---------- */
function Answers({ items, recs, sourceOf, explainOf, onAiExplain }) {
  return items.map((q, i) => (
    <AnswerCard
      key={i}
      i={i}
      q={q}
      r={recs[i] || {}}
      source={sourceOf && sourceOf(i)}
      explain={explainOf && explainOf(i)}
      onAiExplain={onAiExplain}
    />
  ));
}

function AnswerCard({ i, q, r, source, explain, onAiExplain }) {
  const [state, setState] = useState(null); // null | 'loading' | 'shown'
  const [aiData, setAiData] = useState(null);
  const cls = r.correct ? (r.flag === 'slow' ? 'shaky' : 'ok') : 'bad';

  // Lấy đáp án đúng từ r.answer (backend trả về) hoặc q.answer (mock)
  const answerIdx = r.answer !== undefined ? r.answer : q.answer;

  const run = async () => {
    setState('loading');
    if (onAiExplain) {
      const res = await onAiExplain(i, q, r);
      if (res) setAiData(res);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    setState('shown');
  };

  const displayWhy = (aiData && aiData.why) || (explain && explain.why) || r.why;
  const displayTrap = (aiData && aiData.trap) || (explain && explain.trap) || r.trap;
  const displayTiming = (aiData && aiData.timing_note);

  return (
    <div className={'card ' + cls}>
      <p className="q">
        <b>
          {r.correct ? '✓' : r.flag === 'skip' ? '–' : '✕'} Câu {i + 1}.
        </b>{' '}
        {q.q}
        <span className="time-chip">⏱ {fmt(r.sec || 0)}</span>
      </p>
      <p className="muted">
        {r.sel === null || r.sel === undefined ? (
          <i>bỏ trống</i>
        ) : (
          <>
            Bạn chọn: <i>{q.options ? q.options[r.sel] : r.sel}</i>
          </>
        )}
        {!r.correct && answerIdx !== undefined && q.options && (
          <>
            {' '}
            · Đáp án: <b>{q.options[answerIdx]}</b>
          </>
        )}
      </p>
      {FLAG_TEXT[r.flag] && <p className={'flag ' + r.flag}>⚑ {FLAG_TEXT[r.flag]}</p>}

      {state === null && (
        <button className="link" onClick={run}>
          ✨ AI phân tích câu này
        </button>
      )}
      {state === 'loading' && (
        <p className="inline-load">
          <span className="spinner sm" /> Đang hỏi AI phân tích câu {i + 1}…
        </p>
      )}
      {state === 'shown' && (
        <div className="mini">
          {displayWhy && <p>{displayWhy}</p>}
          {displayTrap && <p className="flag wrong">⚑ Bẫy: {displayTrap}</p>}
          {r.flag === 'slow' && (
            <p className="flag slow">⚑ Đúng nhưng mất {fmt(r.sec)} — nên đọc lại cho chắc.</p>
          )}
          {r.flag === 'rush' && (
            <p className="flag wrong">⚑ Chỉ {fmt(r.sec)} — nhanh hơn thời gian đọc hết đề.</p>
          )}
          {displayTiming && (
            <p className="flag slow">⏱ {displayTiming}</p>
          )}
        </div>
      )}
      {source && <Source node={source} />}
    </div>
  );
}

/* ---------- Quiz Stage ---------- */
function Quiz({ go, quizList }) {
  const done = async (pickedMap, timesMap) => {
    const picked = quizList.map((_, i) => (pickedMap[i] !== undefined ? pickedMap[i] : null));
    const times = quizList.map((_, i) => timesMap[i] || 0);

    const res = await apiGradeQuiz(picked, times);

    let records = [];
    if (res && res.records) {
      records = res.records;
    } else {
      // Fallback
      records = quizList.map((q, i) => {
        const sel = picked[i];
        const correct = sel === q.answer;
        const sec = times[i];
        let flag = sel === null ? 'skip' : correct ? (sec > SLOW_SEC ? 'slow' : 'ok') : sec < RUSH_SEC ? 'rush' : 'wrong';
        return {
          node: q.node,
          sel,
          correct,
          sec,
          flag,
          answer: q.answer,
          why: q.why,
          trap: sel !== null && !correct && q.traps ? q.traps[sel] : null,
        };
      });
    }

    const status = {};
    records.forEach((r) => {
      status[r.node] = r.correct ? (r.flag === 'slow' ? 'shaky' : 'ok') : 'weak';
    });

    go({ stage: 'result', records, status });
  };

  return (
    <section>
      <h2>Quiz ôn tập</h2>
      <Runner items={quizList} name="q" onDone={done} submitLabel="Nộp bài" />
    </section>
  );
}

/* ---------- Start Diagnosis Helper ---------- */
function startDiagnosis(s, think, tree) {
  const { missed, shaky, candidates } = weakSignals(s.records);
  const { target, hits } = pickTarget(s.records, tree);
  const targetLabel = (tree[target] || {}).label || target;

  const trace = [...s.trace];
  if (missed.length)
    trace.push({
      t: 'Sai / bỏ trống',
      d: missed.map((r) => `${(tree[r.node] || {}).label || r.node} (${FLAG_TEXT[r.flag]}, ${fmt(r.sec)})`).join(' · '),
    });
  if (shaky.length)
    trace.push({
      t: 'Đúng nhưng chậm',
      d: shaky.map((r) => `${(tree[r.node] || {}).label || r.node} (${fmt(r.sec)} > ${SLOW_SEC}s)`).join(' · '),
    });
  if (!missed.length)
    trace.push({ t: 'Không có câu sai', d: 'Lấy các câu trả lời chậm làm tín hiệu chẩn đoán' });
  trace.push({
    t: 'Định vị',
    d: `${hits.length} tín hiệu cùng thuộc "${targetLabel}" → hỏi 3 câu nền của mục này`,
  });

  think(
    [
      `Đọc ${s.records.length} câu trả lời và thời gian làm từng câu`,
      `Gắn ${candidates.length} tín hiệu yếu về các node trên cây tri thức`,
      `Dựng giả thuyết: chỗ hổng nằm ở ${targetLabel}`,
    ],
    {
      stage: 'analysis',
      target,
      round: 1,
      retry: 0,
      hits,
      trace,
      status: { ...s.status, [target]: 'probing' },
    },
    1800
  );
}

/* ---------- Result Stage ---------- */
function Result({ s, go, think, tree, quizList }) {
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
      1800
    );

  const handleAiExplain = async (i, q, r) => {
    const answerIdx = r.answer !== undefined ? r.answer : q.answer;
    return await apiExplainSingle({
      node_id: r.node,
      question: q.q,
      options: q.options || [],
      correct_idx: answerIdx !== undefined ? answerIdx : 0,
      selected_idx: r.sel,
      time_sec: r.sec,
      flag: r.flag,
    });
  };

  return (
    <section>
      <h2>
        Kết quả: {correct}/{s.records.length} · tổng {fmt(s.records.reduce((a, r) => a + r.sec, 0))}
      </h2>
      <Answers
        items={quizList}
        recs={s.records}
        sourceOf={(i) => tree[s.records[i].node]}
        explainOf={(i) => ({
          why: s.records[i].why || quizList[i]?.why,
          trap: s.records[i].trap,
        })}
        onAiExplain={handleAiExplain}
      />
      {candidates.length ? (
        <>
          <h3>Bạn muốn làm gì tiếp?</h3>
          <div className="row">
            <button className="primary" onClick={explain}>
              ✨ Giải thích đáp án
            </button>
            <button className="ghost" onClick={() => startDiagnosis(s, think, tree)}>
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

/* ---------- Explain Stage (Hiển thị ngay lập tức giải thích cho mọi câu) ---------- */
function Explain({ s, go, think, tree, quizList }) {
  return (
    <section>
      <h2>Giải thích đáp án</h2>
      <p className="muted">Giải thích bám theo nội dung slide của từng câu, không thêm khái niệm ngoài bài.</p>
      {s.records.map((r, i) => {
        const q = quizList[i] || {};
        const answerIdx = r.answer !== undefined ? r.answer : q.answer;
        const why = r.why || q.why || 'Khái niệm này được trình bày trực tiếp trong slide bài giảng.';
        const trap = r.trap || (r.sel !== null && !r.correct && q.traps ? q.traps[r.sel] : null);

        return (
          <div className={'card ' + (r.correct ? 'ok' : 'bad')} key={i}>
            <p className="q">
              <b>
                {r.correct ? '✓' : r.flag === 'skip' ? '–' : '✕'} Câu {i + 1}.
              </b>{' '}
              {q.q}
            </p>
            <p className="muted">
              Đáp án đúng: <b>{q.options && answerIdx !== undefined ? q.options[answerIdx] : ''}</b>
              {r.sel !== null && r.sel !== undefined && !r.correct && (
                <>
                  {' '}
                  · bạn chọn: <i>{q.options ? q.options[r.sel] : r.sel}</i>
                </>
              )}
              {(r.sel === null || r.sel === undefined) && (
                <>
                  {' '}
                  · <i>bạn bỏ trống câu này</i>
                </>
              )}
            </p>
            <p>{why}</p>
            {trap && <p className="flag wrong">⚑ Bẫy: {trap}</p>}
            {r.flag === 'slow' && (
              <p className="flag slow">⚑ Đúng nhưng mất {fmt(r.sec)} — nên đọc lại phần này cho chắc.</p>
            )}
            {r.flag === 'rush' && (
              <p className="flag wrong">⚑ Chỉ {fmt(r.sec)} — nhanh hơn thời gian đọc hết đề.</p>
            )}
            <Source node={tree[r.node]} />
          </div>
        );
      })}
      <div className="row">
        <button className="primary" onClick={() => startDiagnosis(s, think, tree)}>
          🔍 Tìm phần nền bị hổng →
        </button>
        <button className="ghost" onClick={() => go({ stage: 'result' })}>
          ← Về bảng kết quả
        </button>
      </div>
    </section>
  );
}

/* ---------- Analysis Stage (AI Hypothesis & Chatbot) ---------- */
function Analysis({ s, go, think, tree }) {
  const node = tree[s.target] || { label: s.target, page: 'Slide' };
  const hits = s.hits || [];
  const recs = s.records.filter((r) => hits.includes(r.node));
  const rushed = recs.some((r) => r.flag === 'rush');
  const onlySlow = recs.length > 0 && recs.every((r) => r.correct);
  const confidence = onlySlow ? 'thấp' : rushed ? 'trung bình' : hits.length >= 2 ? 'trung bình' : 'thấp';

  const [aiHypo, setAiHypo] = useState(null);
  const [chat, setChat] = useState([]);
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    apiGetHypothesis({
      target_node_id: s.target,
      hits: recs.map((r) => ({
        node: r.node,
        label: (tree[r.node] || {}).label || r.node,
        flag: r.flag,
        sec: r.sec,
      })),
      only_slow: onlySlow,
      rushed_any: rushed,
    }).then((res) => {
      if (res) setAiHypo(res);
    });
  }, [s.target]);

  const send = async (qText) => {
    if (!qText.trim()) return;
    const userMsg = { me: true, text: qText };
    const nextChat = [...chat, userMsg];
    setChat(nextChat);
    setDraft('');
    setChatLoading(true);

    const res = await apiChatMessage({
      target_node_id: s.target,
      weak_signals: recs.map((r) => ({
        node: r.node,
        label: (tree[r.node] || {}).label || r.node,
        flag: r.flag,
        sec: r.sec,
      })),
      message: qText,
      history: chat.map((c) => ({
        role: c.me ? 'user' : 'assistant',
        content: c.text,
      })),
    });

    setChatLoading(false);
    const replyText = res
      ? res.reply
      : `Vì ${hits.length} tín hiệu yếu của bạn đều nằm dưới "${node.label}". Nguồn: ${node.page}.`;
    setChat([...nextChat, { me: false, text: replyText }]);
    go({ trace: [...s.trace, { t: 'Học viên hỏi lại', d: qText }] });
  };

  const accept = () =>
    think(
      [`Lấy 3 câu nền của "${node.label}"`, `Nguồn: ${node.page}`],
      {
        stage: 'probe',
        trace: [...s.trace, { t: 'Học viên đánh giá', d: 'Giả thuyết hợp lý → đồng ý kiểm tra 3 câu nền' }],
      },
      1200
    );

  const skipToPlan = () =>
    go({
      stage: 'plan',
      verdict: 'accepted',
      trace: [
        ...s.trace,
        { t: 'Học viên đánh giá', d: 'Giả thuyết hợp lý → ôn luôn, bỏ qua bước kiểm tra' },
      ],
    });

  return (
    <section>
      <h2>AI nghĩ gì về bài làm của bạn</h2>

      <div className="card">
        <h3>Tín hiệu thu được</h3>
        <ul>
          {recs.map((r, i) => (
            <li key={i}>
              {(tree[r.node] || {}).label || r.node} — {FLAG_TEXT[r.flag] || 'đúng'} ({fmt(r.sec)})
            </li>
          ))}
        </ul>

        <h3>Giả thuyết</h3>
        <p>
          {aiHypo && aiHypo.hypothesis_text ? (
            aiHypo.hypothesis_text
          ) : (
            <>
              {hits.length} tín hiệu này đều nằm dưới <b>{node.label}</b>. Nhiều khả năng chỗ hổng là ở
              mục này, hoặc ở phần nền phía trên nó. Để xác nhận, mình muốn hỏi bạn 3 câu nền của mục
              này — sai tiếp thì mình sẽ đề nghị leo lên một tầng.
            </>
          )}
        </p>

        <p className="muted">
          Mức chắc chắn: <b>{aiHypo?.confidence || confidence}</b>
          {onlySlow && ' — bạn không sai câu nào, giả thuyết chỉ dựa trên thời gian trả lời.'}
          {rushed && ' — có câu bạn bấm rất nhanh, có thể là bấm bừa chứ không phải không biết.'}
          {!onlySlow && !rushed && ' — dựa trên câu sai, chưa kiểm tra lại.'}
        </p>
        <Source node={node} />
      </div>

      <h3>Bạn thấy suy luận này có hợp lý không?</h3>
      <div className="row">
        <button className="primary" onClick={accept}>
          Hợp lý — kiểm tra 3 câu nền →
        </button>
        <button className="ghost" onClick={skipToPlan}>
          Hợp lý — ôn luôn mục này
        </button>
        <button className="ghost" onClick={() => setOpen(true)}>
          💬 Chưa thuyết phục — hỏi thêm
        </button>
      </div>

      {open && (
        <div className="card">
          <h3>Hỏi lại AI</h3>
          <div className="chat">
            {chat.map((m, i) => (
              <p key={i} className={m.me ? 'bub me' : 'bub ai'}>
                {m.text}
              </p>
            ))}
            {chatLoading && (
              <p className="inline-load">
                <span className="spinner sm" /> Trợ lý Gemini đang trả lời…
              </p>
            )}
          </div>
          <div className="row">
            {[
              'Vì sao lại là mục này mà không phải mục khác?',
              'Mục này là gì, mình xem lại ở đâu?',
              'Mình sai câu đó do đọc nhầm đề thôi',
            ].map((qText, i) => (
              <button key={i} className="link" onClick={() => send(qText)}>
                {qText}
              </button>
            ))}
          </div>
          <div className="row">
            <input
              className="input"
              value={draft}
              placeholder="Hỏi gì đó về chẩn đoán này…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(draft)}
            />
            <button className="primary" onClick={() => send(draft)}>
              Gửi
            </button>
          </div>
          <p className="hint">Mọi câu hỏi của bạn được ghi vào dấu vết quyết định.</p>
        </div>
      )}
    </section>
  );
}

/* ---------- Probe Stage (Câu hỏi chẩn đoán) ---------- */
function Probe({ s, think, tree }) {
  const [probeList, setProbeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const node = tree[s.target] || { label: s.target, page: 'Slide' };

  useEffect(() => {
    apiGetProbes(s.target).then((res) => {
      setLoading(false);
      if (res && res.questions && res.questions.length > 0) {
        setProbeList(res.questions);
      } else {
        setProbeList([
          { q: `Khái niệm cơ bản của ${node.label} là gì?`, options: ['Định nghĩa chuẩn', 'Phương án bẫy 1', 'Phương án bẫy 2'] },
          { q: `Đặc tính cốt lõi của ${node.label}?`, options: ['Tính chất đúng', 'Tính chất sai 1', 'Tính chất sai 2'] },
        ]);
      }
    });
  }, [s.target, s.retry]);

  const done = async (pickedMap, timesMap) => {
    const picked = probeList.map((_, i) => (pickedMap[i] !== undefined ? pickedMap[i] : null));
    const times = probeList.map((_, i) => timesMap[i] || 0);

    const res = await apiEvaluateRound({
      target_node_id: s.target,
      round_num: s.round,
      picked,
      times,
    });

    const decision = res ? res.decision : 'locate';
    const nextTarget = res ? res.next_target : null;
    const recs = res ? res.records : probeList.map((q, i) => ({ node: s.target, correct: picked[i] === 0, sec: times[i], answer: 0 }));
    const bad = res ? res.bad_count : recs.filter((r) => !r.correct).length;
    const slow = res ? res.slow_count : recs.filter((r) => r.flag === 'slow').length;

    const trace = [
      ...s.trace,
      {
        t: `Vòng ${s.round}${s.retry ? ` (làm lại lần ${s.retry})` : ''} · ${node.label}`,
        d: `sai/bỏ trống ${bad}/${probeList.length}${slow ? `, ${slow} câu đúng nhưng chậm` : ''}, ${fmt(
          recs.reduce((a, r) => a + (r.sec || 0), 0)
        )}`,
      },
    ];

    const conclusion = {
      locate: `Nền vẫn nắm được → chỗ hổng khu trú ở "${node.label}"`,
      escalate: `Vẫn hổng ở tầng này → đề nghị kiểm tra tiếp "${nextTarget && tree[nextTarget] ? tree[nextTarget].label : ''}"`,
      restart: 'Sai cả ở tầng nền và đã chạm giới hạn leo cây',
    }[decision];

    think(
      [`Chấm ${probeList.length} câu nền của "${node.label}"`, 'Đối chiếu với cây tri thức', conclusion],
      {
        stage: 'review',
        roundRecs: recs,
        decision,
        nextTarget,
        trace,
        status: { ...s.status, [s.target]: 'weak' },
      },
      1500
    );
  };

  if (loading) {
    return (
      <section className="think">
        <div className="spinner" />
        <h2>Đang tải câu hỏi nền…</h2>
      </section>
    );
  }

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
        items={probeList}
        name={'p' + s.round + '-' + s.retry}
        source={node}
        onDone={done}
        submitLabel="Kiểm tra"
      />
    </section>
  );
}

/* ---------- Review Stage ---------- */
function Review({ s, go, think, tree }) {
  const node = tree[s.target] || { label: s.target, page: 'Slide' };
  const bad = s.roundRecs.filter((r) => !r.correct).length;
  const skipped = s.roundRecs.filter((r) => r.flag === 'skip').length;
  const [fb, setFb] = useState(null); // null | 'loading' | 'shown'
  const [aiFeedback, setAiFeedback] = useState(null);

  const askFeedback = async () => {
    setFb('loading');
    const res = await apiExplainRound({
      target_node_id: s.target,
      round_num: s.round,
      decision: s.decision,
      records: s.roundRecs.map((r, i) => ({
        question: `Câu ${i + 1}`,
        options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C'],
        correct_idx: r.answer !== undefined ? r.answer : 0,
        selected_idx: r.sel,
        sec: r.sec,
        flag: r.flag || 'ok',
      })),
    });
    setAiFeedback(res);
    setFb('shown');
    go({ trace: [...s.trace, { t: 'Học viên chọn', d: `Xem giải thích đáp án vòng ${s.round}` }] });
  };

  const analysis = {
    locate: `Bạn nắm được phần nền của "${node.label}" (chỉ sai ${bad}/${s.roundRecs.length}). Chỗ hổng nằm đúng ở mục này, không cần kiểm tra lên tầng trên nữa.`,
    escalate: `Bạn sai ${bad}/${s.roundRecs.length} câu nền của "${node.label}"${
      skipped ? ` (trong đó ${skipped} câu bỏ trống)` : ''
    }. Dấu hiệu là chỗ hổng nằm sâu hơn một tầng, ở "${s.nextTarget && tree[s.nextTarget] ? tree[s.nextTarget].label : ''}".`,
    restart: `Bạn sai ${bad}/${s.roundRecs.length} câu ngay ở tầng nền và đã đi hết số vòng cho phép. Hệ thống không khoanh nhỏ hơn được nữa.`,
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
    const upNode = tree[up] || { label: up, page: 'Slide' };
    think(
      [`Lấy câu hỏi nền của "${upNode.label}"`, `Nguồn: ${upNode.page}`],
      {
        stage: 'probe',
        target: up,
        round: s.round + 1,
        retry: 0,
        trace: [...s.trace, { t: 'Leo lên', d: `Học viên đồng ý kiểm tra tiếp "${upNode.label}"` }],
        status: { ...s.status, [up]: 'probing' },
      },
      1200
    );
  };

  const dummyQuestions = s.roundRecs.map((_, i) => ({
    q: `Câu hỏi nền ${i + 1}`,
    options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C'],
  }));

  return (
    <section>
      <h2>Kết quả vòng {s.round}</h2>
      <Answers
        items={dummyQuestions}
        recs={s.roundRecs}
        explainOf={(i) => ({ why: s.roundRecs[i]?.why })}
      />

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
          <span className="spinner sm" /> Đang soạn nhận xét từ AI cho vòng {s.round}…
        </p>
      )}
      {fb === 'shown' && (
        <RoundFeedback
          s={s}
          node={node}
          bad={bad}
          skipped={skipped}
          aiFeedback={aiFeedback}
        />
      )}

      <h3>Bạn muốn làm gì tiếp?</h3>
      <div className="row">
        {s.decision === 'escalate' && (
          <button className="primary" onClick={next}>
            Kiểm tra tiếp "{(tree[s.nextTarget] || {}).label || s.nextTarget}" →
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

/* ---------- RoundFeedback Component (Khôi phục nguyên bản mockup) ---------- */
function RoundFeedback({ s, node, bad, skipped, aiFeedback }) {
  const slow = s.roundRecs.filter((r) => r.flag === 'slow').length;
  const rush = s.roundRecs.filter((r) => r.flag === 'rush').length;

  const notes = [];
  if (bad === 0) notes.push(`Bạn trả lời đúng cả ${s.roundRecs.length} câu nền của "${node.label}".`);
  else notes.push(`Bạn sai ${bad}/${s.roundRecs.length} câu nền của "${node.label}".`);
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
      <p>{aiFeedback?.summary || notes.join(' ')}</p>
      {aiFeedback?.advice && <p className="good">{aiFeedback.advice}</p>}
      <h3>Giải thích từng câu</h3>
      {s.roundRecs.map((r, i) => (
        <div className="mini" key={i}>
          <p className="q">
            <b>
              {r.correct ? '✓' : r.flag === 'skip' ? '–' : '✕'} Câu {i + 1}.
            </b>
          </p>
          <p className="muted">
            {r.sel !== null && r.sel !== undefined ? (
              <>Bạn đã chọn phương án {r.sel + 1}</>
            ) : (
              <><i>bỏ trống</i></>
            )}
            {!r.correct && r.answer !== undefined && (
              <> · Đáp án đúng: <b>Phương án {r.answer + 1}</b></>
            )}
          </p>
          {r.why && <p>{r.why}</p>}
        </div>
      ))}
      <Source node={node} />
    </div>
  );
}

/* ---------- Plan Stage (Lộ trình ôn tập) ---------- */
function Plan({ s, go, tree }) {
  const node = tree[s.target] || { label: s.target || 'Toàn bài', page: 'Slide d1' };
  const restart = s.verdict === 'restart';
  const defaultReviews = DEFAULT_REVIEW[s.target] || [`Xem lại ${node.page}`];
  const rootNode = tree.root || DEFAULT_TREE.root;

  const [aiPlan, setAiPlan] = useState(null);

  useEffect(() => {
    apiGeneratePlan({
      verdict: s.verdict || 'located',
      target_node_id: s.target,
      trace: s.trace,
    }).then((res) => {
      if (res) setAiPlan(res);
    });
  }, [s.verdict, s.target]);

  const items = aiPlan?.items?.length ? aiPlan.items.map((it) => it.text) : defaultReviews;
  const whyExplanation = aiPlan?.why_explanation;

  return (
    <section>
      <h2>{restart ? 'Nên học lại bài này từ đầu' : `Lộ trình ôn: ${node.label}`}</h2>

      {restart ? (
        <div className="card bad">
          <p>Bạn sai cả ở phần nền, không chỉ ở chi tiết. Tóm tắt nhanh cả bài trước khi làm lại quiz:</p>
          <ul>
            {(rootNode.compact || []).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <Source node={rootNode} />
        </div>
      ) : (
        <div className="card ok">
          <ul>
            {items.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <Source node={node} />
        </div>
      )}

      {s.verdict === 'accepted' && (
        <p className="hint">
          Bạn đồng ý với giả thuyết và bỏ qua bước kiểm tra, nên hệ thống chưa xác nhận lại bằng câu
          hỏi — nếu ôn xong vẫn thấy vướng, làm lại quiz để chẩn đoán tiếp.
        </p>
      )}

      {s.verdict === 'self' && (
        <p className="hint">
          Bạn chọn tự ôn nên hệ thống dừng ở mức "{node.label}" — chỗ hổng có thể còn nằm sâu hơn một
          tầng. Làm lại quiz sau khi ôn để kiểm tra.
        </p>
      )}

      <div className="card">
        <h3>Vì sao bạn nhận lộ trình này</h3>
        {whyExplanation && <p>{whyExplanation}</p>}
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

/* ---------- Cột phải: Cây tri thức & Dấu vết ---------- */
function TreeView({ tree, status, target }) {
  const render = (id, depth) => {
    const node = tree[id];
    if (!node) return null;
    const kids = Object.values(tree).filter((n) => n.parent === id);
    const st = id === target ? 'probing' : status[id];
    return (
      <li key={id} className={'tn ' + (st || '')} style={{ marginLeft: depth * 12 }}>
        <span className="dot" /> {node.label}
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

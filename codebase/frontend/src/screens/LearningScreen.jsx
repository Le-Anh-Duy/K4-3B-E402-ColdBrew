import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { Button, CoffeeBeanIcon, Feedback, ProgressBar } from '../components/UI'
import { learningService } from '../services/learningService'

const INITIAL_FLOW = {
  stage: 'quiz',
  records: [],
  target: null,
  hits: [],
  status: {},
  trace: [],
  hypothesis: null,
  probeQuestions: [],
  round: 1,
  retry: 0,
  roundRecs: [],
  decision: null,
  nextTarget: null,
  lastFailed: null,
  gap: null,
  ceiling: null,
  scenario: null,
  verdict: null,
  plan: null,
  retestRecs: [],
  feedback: null,
  drafts: {},
  queue: [],
  resolved: [],
  skipped: [],
  hypotheses: {},
  plans: {},
  probeKey: null,
  probeSource: null,
  probeUsage: null,
  chat: [],
  chatOpen: false,
}

const FLAG_TEXT = {
  slow: 'Đúng nhưng chậm — nên xem lại cho chắc',
  wrong: 'Chưa chính xác',
  rush: 'Trả lời rất nhanh — có thể chưa đọc hết đề',
  skip: 'Đã bỏ qua',
}

const fmt = seconds => `${Math.floor((seconds || 0) / 60)}:${String((seconds || 0) % 60).padStart(2, '0')}`

export default function LearningScreen({ session, isActive = true, onComplete, onHome }) {
  const [state, setState] = useState(() => ({ ...INITIAL_FLOW, ...(learningService.getFlow(session.id) || {}) }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const completedRef = useRef(false)
  const tree = session.tree || {}
  const node = tree[state.target]

  function update(patch) {
    setState(previous => ({ ...previous, ...patch }))
  }

  function saveDraft(key, draft) {
    setState(previous => ({ ...previous, drafts: { ...(previous.drafts || {}), [key]: draft } }))
  }

  useEffect(() => {
    learningService.saveProgress(session.id, state, session.remote, session.owner).catch(() => {})
  }, [session.id, session.owner, session.remote, state])

  useEffect(() => {
    if (state.stage !== 'complete' || completedRef.current) return
    completedRef.current = true
    const answered = state.records.filter(record => record.flag !== 'skip').length
    const correct = state.records.filter(record => record.correct).length
    const weak = [...new Set(state.records.filter(record => !record.correct || record.flag === 'slow').map(record => tree[record.node]?.label || record.node))]
    onComplete({ id: session.id, topic: session.topic, total: session.questions.length, answered, correct, weak, date: new Date().toISOString() })
      .catch(nextError => setError(`Chưa lưu được phiên: ${nextError.message}`))
  }, [onComplete, session, state.records, state.stage, tree])

  async function submitQuiz(picked, times) {
    setBusy(true)
    setError('')
    try {
      const records = await learningService.gradeQuiz(session, picked, times)
      const status = {}
      records.forEach(record => { status[record.node] = record.correct ? (record.flag === 'slow' ? 'shaky' : 'ok') : 'weak' })
      update({ stage: 'result', records, status })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  async function startDiagnosis() {
    const diagnosis = learningService.pickTarget(state.records, tree)
    if (!diagnosis.target) {
      update({
        stage: 'refuse',
        trace: [...state.trace, { t: 'Chưa chẩn đoán', d: diagnosis.reason }],
      })
      return
    }
    setBusy(true)
    setError('')
    try {
      const hypothesis = await learningService.getHypothesis({ session, target: diagnosis.target, hits: diagnosis.hits, records: state.records })
      const targetLabel = tree[diagnosis.target]?.label || diagnosis.target
      const weakSummary = diagnosis.candidates.map(record => `${tree[record.node]?.label || record.node} (${FLAG_TEXT[record.flag] || 'tín hiệu yếu'}, ${fmt(record.sec)})`).join(' · ')
      update({
        stage: 'analysis',
        target: diagnosis.target,
        hits: diagnosis.hits,
        queue: diagnosis.queue || [{ target: diagnosis.target, hits: diagnosis.hits }],
        hypotheses: { ...state.hypotheses, [diagnosis.target]: hypothesis },
        hypothesis,
        round: 1,
        retry: 0,
        trace: [
          ...state.trace,
          { t: 'Tín hiệu yếu', d: weakSummary },
          { t: 'Định vị', d: `${diagnosis.hits.length} tín hiệu cùng thuộc “${targetLabel}”` },
        ],
        status: { ...state.status, [diagnosis.target]: 'probing' },
      })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openProbe(target = state.target, patch = {}) {
    setBusy(true)
    setError('')
    try {
      const round = patch.round ?? state.round
      const retry = patch.retry ?? state.retry
      const probe = await learningService.getProbes(session, target, { round, retry, purpose: 'probe' })
      update({
        stage: 'probe', target, probeQuestions: probe.questions,
        probeKey: probe.probeKey, probeSource: probe.source, probeUsage: probe.usage,
        ...patch,
      })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitProbe(picked, times) {
    setBusy(true)
    setError('')
    try {
      const result = await learningService.evaluateRound({
        session,
        target: state.target,
        round: state.round,
        questions: state.probeQuestions,
        picked,
        times,
        lastFailed: state.lastFailed,
        probeKey: state.probeKey,
      })
      const targetLabel = tree[state.target]?.label || state.target
      update({
        stage: 'review',
        roundRecs: result.records,
        decision: result.decision,
        nextTarget: result.next_target,
        gap: result.gap,
        ceiling: result.ceiling,
        scenario: result.scenario,
        lastFailed: result.decision === 'escalate' ? (state.lastFailed || state.target) : state.lastFailed,
        status: { ...state.status, [state.target]: result.decision === 'locate' ? 'shaky' : 'weak' },
        trace: [...state.trace, { t: `Vòng ${state.round} · ${targetLabel}`, d: `sai/bỏ trống ${result.bad_count}/${state.probeQuestions.length}` }],
      })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  async function openPlan(verdict) {
    const cached = state.plans?.[state.target]
    if (cached && cached.verdict === verdict) {
      update({ stage: 'plan', verdict, plan: cached })
      return
    }
    setBusy(true)
    setError('')
    const nextState = { ...state, verdict, stage: 'plan' }
    try {
      const plan = { ...(await learningService.generatePlan({ session, state: nextState })), verdict }
      update({ stage: 'plan', verdict, plan, plans: { ...(state.plans || {}), [state.target]: plan } })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  // Xong một vùng thì đi tiếp vùng còn lại, thay vì kết thúc phiên ngay.
  const dropped = [...(state.resolved || []), ...(state.skipped || [])]
  const remaining = (state.queue || []).filter(item => !dropped.includes(item.target))
  const nextArea = remaining.find(item => item.target !== state.target) || null

  async function goToArea(item, resolvedTarget = null) {
    // Giả thuyết và lộ trình của mục đã phân tích rồi thì lấy lại từ phiên,
    // không gọi Gemini lần nữa — quay đi quay lại giữa các mục là chuyện thường.
    const cached = state.hypotheses?.[item.target]
    const label = tree[item.target]?.label || item.target
    const shared = {
      ...INITIAL_FLOW,
      records: state.records,
      queue: state.queue,
      resolved: [...new Set([...(state.resolved || []), resolvedTarget].filter(Boolean))],
      skipped: state.skipped || [],
      hypotheses: state.hypotheses || {},
      plans: state.plans || {},
      status: state.status,
      stage: 'analysis',
      target: item.target,
      hits: item.hits,
      plan: state.plans?.[item.target] || null,
      round: 1,
      trace: [...state.trace, { t: 'Chuyển mục', d: label }],
    }

    if (cached) {
      update({ ...shared, hypothesis: cached })
      return
    }

    setBusy(true)
    setError('')
    try {
      const hypothesis = await learningService.getHypothesis({ session, target: item.target, hits: item.hits, records: state.records })
      update({ ...shared, hypothesis, hypotheses: { ...(state.hypotheses || {}), [item.target]: hypothesis } })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  async function startRetest() {
    const target = state.gap || state.target
    setBusy(true)
    setError('')
    try {
      // Retest phải là bộ câu KHÁC vòng chẩn đoán, không thì chỉ đo được trí nhớ.
      const probe = await learningService.getProbes(session, target, { round: state.round, retry: state.retry, purpose: 'retest' })
      update({
        stage: 'retest', target, probeQuestions: probe.questions,
        probeKey: probe.probeKey, probeSource: probe.source, probeUsage: probe.usage,
      })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitRetest(picked, times) {
    setBusy(true)
    setError('')
    try {
      const result = await learningService.evaluateRound({
        session,
        target: state.target,
        round: state.round,
        questions: state.probeQuestions,
        picked,
        times,
        lastFailed: state.lastFailed,
        probeKey: state.probeKey,
      })
      const passed = result.records.every(record => record.correct)
      update({
        stage: 'retestDone',
        retestRecs: result.records,
        status: { ...state.status, [state.target]: passed ? 'ok' : 'weak' },
        trace: [...state.trace, { t: 'Kiểm tra lại', d: passed ? 'Đúng tất cả — xác nhận đã nắm' : 'Vẫn còn câu sai — giữ cờ cần ôn' }],
      })
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  const phase = state.stage === 'quiz' ? 0 : state.stage === 'complete' ? 3 : ['result', 'analysis', 'refuse', 'probe', 'review', 'explain'].includes(state.stage) ? 1 : 2
  const titles = {
    quiz: 'Quiz ôn tập', result: 'Kết quả quiz', explain: 'Giải thích đáp án', refuse: 'Chưa đủ căn cứ',
    analysis: 'Phân tích bài làm', probe: `Chẩn đoán · vòng ${state.round}`, review: `Kết quả vòng ${state.round}`,
    plan: 'Lộ trình ôn tập', retest: 'Kiểm tra lại sau khi ôn', retestDone: 'Kết quả kiểm tra lại', complete: 'Phiên học của bạn',
  }

  return (
    <div className="learning-layout">
      <div className="learning-top">
        <button className="text-button muted" onClick={onHome}>← Trang chủ <span className="desktop-only">· phiên được tự động lưu</span></button>
        <span className="pill">{session.source === 'backend' ? 'Dữ liệu có cây tri thức' : 'Chế độ demo offline'}</span>
      </div>
      <div className="learning-grid">
        <div className="learning-content">
          <div className="stepper" aria-label="Các bước học tập">
            {['Làm quiz', 'Hiểu lỗ hổng', 'Ôn đúng chỗ'].map((label, index) => (
              <div className={phase === index ? 'current' : phase > index ? 'done' : ''} aria-current={phase === index ? 'step' : undefined} key={label}>
                <span>{phase > index ? '✓' : `0${index + 1}`}</span>{label}
              </div>
            ))}
          </div>
          <div className="learning-title">
            <span className="eyebrow">{session.topic}</span>
            <h1>{titles[state.stage]}</h1>
            <p className="muted">{state.stage === 'quiz' ? 'Làm hết bài trước khi xem đáp án. Bạn có thể quay lại, bỏ chọn hoặc bỏ qua.' : 'Mỗi kết luận đều dựa trên tín hiệu và cây tri thức của bài.'}</p>
          </div>

          {state.queue.length > 1 && !['quiz', 'result', 'complete'].includes(state.stage) && (
            <AreaProgress
              state={state}
              tree={tree}
              onPick={item => goToArea(item)}
              onSkip={item => update({ skipped: [...new Set([...(state.skipped || []), item.target])] })}
              onRestore={item => update({
                skipped: (state.skipped || []).filter(id => id !== item.target),
                resolved: (state.resolved || []).filter(id => id !== item.target),
              })}
            />
          )}
          {error && <Feedback type="error" title={error} />}
          {busy && <Thinking />}

          {state.stage === 'quiz' && (
            <QuestionRunner key="quiz" items={session.questions} isActive={isActive} submitting={busy} initialDraft={state.drafts.quiz} onDraftChange={draft => saveDraft('quiz', draft)} onDone={submitQuiz} submitLabel="Nộp bài" />
          )}
          {!busy && state.stage === 'result' && (
            <QuizResult session={session} state={state} onExplain={() => update({ stage: 'explain' })} onDiagnose={startDiagnosis} onComplete={() => update({ stage: 'complete' })} />
          )}
          {!busy && state.stage === 'explain' && (
            <section>
              <AnswerReview items={session.questions} records={state.records} tree={tree} showExplanation />
              <div className="action-row">
                <Button onClick={startDiagnosis}>Tìm phần nền bị hổng →</Button>
                <Button variant="secondary" onClick={() => update({ stage: 'result' })}>Về kết quả</Button>
              </div>
            </section>
          )}
          {!busy && state.stage === 'refuse' && (
            <section>
              <Feedback type="warning" title="Chưa đủ căn cứ để chỉ ra chỗ hổng">{state.trace.at(-1)?.d}</Feedback>
              <p className="muted">Đoán một mục rồi yêu cầu bạn ôn nhầm sẽ kém hữu ích hơn việc nói rõ rằng dữ liệu hiện chưa đủ.</p>
              <div className="action-row"><Button onClick={() => update({ ...INITIAL_FLOW, stage: 'quiz' })}>Làm lại quiz</Button><Button variant="secondary" onClick={() => update({ stage: 'result' })}>Về kết quả</Button></div>
            </section>
          )}
          {!busy && state.stage === 'analysis' && (
            <AnalysisPanel session={session} state={state} onAccept={() => openProbe()} onPlan={() => openPlan('accepted')} onUpdate={update} />
          )}
          {state.stage === 'probe' && (
            <QuestionRunner key={`${state.target}-${state.round}-${state.retry}`} items={state.probeQuestions} isActive={isActive} submitting={busy} initialDraft={state.drafts[`probe-${state.target}-${state.round}-${state.retry}`]} onDraftChange={draft => saveDraft(`probe-${state.target}-${state.round}-${state.retry}`, draft)} onDone={submitProbe} submitLabel="Kiểm tra" source={node?.page} originNote={<ProbeOrigin state={state} />} />
          )}
          {!busy && state.stage === 'review' && (
            <ReviewPanel
              state={state}
              tree={tree}
              onRetry={() => openProbe(state.target, { retry: state.retry + 1, trace: [...state.trace, { t: 'Học viên chọn', d: `Làm lại vòng ${state.round}` }] })}
              onNext={() => openProbe(state.nextTarget, { round: state.round + 1, retry: 0, trace: [...state.trace, { t: 'Leo tầng', d: `Kiểm tra tiếp “${tree[state.nextTarget]?.label || state.nextTarget}”` }], status: { ...state.status, [state.nextTarget]: 'probing' } })}
              onPlan={openPlan}
            />
          )}
          {!busy && state.stage === 'plan' && (
            <PlanPanel state={state} tree={tree} onRetest={startRetest} onBack={() => update({ stage: 'analysis', chatOpen: true })} />
          )}
          {state.stage === 'retest' && (
            <QuestionRunner key={`retest-${state.target}`} items={state.probeQuestions} isActive={isActive} submitting={busy} initialDraft={state.drafts[`retest-${state.target}`]} onDraftChange={draft => saveDraft(`retest-${state.target}`, draft)} onDone={submitRetest} submitLabel="Nộp kiểm tra lại" source={node?.page} originNote={<ProbeOrigin state={state} />} />
          )}
          {!busy && state.stage === 'retestDone' && (
            <RetestResult state={state} tree={tree} nextArea={nextArea} onNextArea={() => goToArea(nextArea, state.target)} onPlan={() => update({ stage: 'plan' })} onFeedback={feedback => update({ feedback })} onComplete={() => update({ stage: 'complete' })} />
          )}
          {!busy && state.stage === 'complete' && (
            <Completion state={state} total={session.questions.length} onHome={onHome} />
          )}
        </div>
        <LearningAside session={session} state={state} tree={tree} onFinish={() => update({ stage: 'complete' })} />
      </div>
    </div>
  )
}

function QuestionRunner({ items, isActive, submitting = false, initialDraft, onDraftChange, onDone, submitLabel, source, originNote = null }) {
  const [index, setIndex] = useState(() => Math.min(initialDraft?.index || 0, Math.max(items.length - 1, 0)))
  const [picked, setPicked] = useState(() => initialDraft?.picked || {})
  const [times, setTimes] = useState(() => initialDraft?.times || {})
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [, tick] = useState(0)
  const draftChangeRef = useRef(onDraftChange)
  const startedAt = useRef(isActive && !submitting && pageVisible ? Date.now() : null)
  const timingActive = isActive && pageVisible && !submitting

  useEffect(() => { draftChangeRef.current = onDraftChange }, [onDraftChange])

  useEffect(() => {
    draftChangeRef.current?.({ index, picked, times })
  }, [index, picked, times])

  useEffect(() => {
    const syncVisibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', syncVisibility)
    return () => document.removeEventListener('visibilitychange', syncVisibility)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => { if (timingActive) tick(value => value + 1) }, 1000)
    return () => clearInterval(timer)
  }, [timingActive])

  useEffect(() => {
    if (!timingActive && startedAt.current) {
      const elapsed = Math.round((Date.now() - startedAt.current) / 1000)
      setTimes(previous => ({ ...previous, [index]: (previous[index] || 0) + elapsed }))
      startedAt.current = null
    } else if (timingActive && !startedAt.current) startedAt.current = Date.now()
  }, [index, timingActive])

  function commit() {
    if (!startedAt.current) return times
    const elapsed = Math.round((Date.now() - startedAt.current) / 1000)
    const next = { ...times, [index]: (times[index] || 0) + elapsed }
    setTimes(next)
    startedAt.current = timingActive ? Date.now() : null
    return next
  }

  function move(nextIndex) {
    commit()
    setIndex(nextIndex)
  }

  const question = items[index]
  const selected = picked[index]
  const liveSeconds = (times[index] || 0) + (timingActive && startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0)
  const doneCount = Object.keys(picked).length

  return (
    <section>
      <div className="question-meta"><span>Câu {index + 1}/{items.length}</span><span>⏱ {fmt(liveSeconds)}</span></div>
      <ProgressBar value={(index + 1) / items.length * 100} label="Tiến độ bộ câu hỏi" />
      <section className="question-card">
        <span className="eyebrow">CHỌN MỘT ĐÁP ÁN</span>
        <h2>{question.text || question.q}</h2>
        <div className="answers" role="group" aria-label="Các đáp án">
          {question.options.map((option, optionIndex) => (
            <button key={option} className={`answer ${selected === optionIndex ? 'selected' : ''}`} aria-pressed={selected === optionIndex} disabled={submitting} onClick={() => setPicked(previous => ({ ...previous, [index]: optionIndex }))}>
              <span className="answer-letter">{'ABCD'[optionIndex]}</span><span>{option}</span><span className="answer-indicator">{selected === optionIndex ? '●' : ''}</span>
            </button>
          ))}
        </div>
        {source && <p className="source-line">▤ <CitedText text={source} />{originNote}</p>}
        <div className="runner-note">
          {selected === undefined ? <span>Chưa chọn — bạn có thể bỏ qua câu này.</span> : <button className="text-button" disabled={submitting} onClick={() => setPicked(previous => { const next = { ...previous }; delete next[index]; return next })}>Bỏ chọn</button>}
          <span>{doneCount}/{items.length} câu đã chọn</span>
        </div>
        <div className="question-footer runner-actions">
          <Button variant="secondary" disabled={submitting || index === 0} onClick={() => move(index - 1)}>← Câu trước</Button>
          {index === items.length - 1 ? (
            <Button disabled={submitting} onClick={() => onDone(items.map((_, itemIndex) => picked[itemIndex] ?? null), Object.assign(Array(items.length).fill(0), commit()))}>{submitting ? 'Đang chấm…' : submitLabel}</Button>
          ) : (
            <Button disabled={submitting} onClick={() => move(index + 1)}>{selected === undefined ? 'Bỏ qua' : 'Câu tiếp'} →</Button>
          )}
        </div>
      </section>
    </section>
  )
}

// Nhận xét chung TRƯỚC khi chẩn đoán: nói rõ có mấy vùng yếu, không chỉ vùng sắp làm.
function AreasOverview({ session, state }) {
  const diagnosis = learningService.pickTarget(state.records, session.tree)
  const areas = diagnosis.queue || []
  if (areas.length < 2) return null
  return <div className="areas-overview">
    <strong>Bài làm của bạn có tín hiệu yếu ở {areas.length} mục:</strong>
    <ul>{areas.map(item => (
      <li key={item.target}>{session.tree[item.target]?.label || item.target} — {item.hits.length} câu</li>
    ))}</ul>
    <p className="muted">Hệ thống chẩn đoán lần lượt từng mục, bắt đầu từ mục nhiều tín hiệu nhất. Xong mục nào sẽ mời bạn sang mục kế tiếp.</p>
  </div>
}

// Học viên tự chọn ôn mục nào, bỏ mục nào — hệ thống xếp thứ tự chứ không áp đặt.
function AreaProgress({ state, tree, onPick, onSkip, onRestore }) {
  const resolved = state.resolved || []
  const skipped = state.skipped || []

  return <ol className="area-progress" aria-label="Các mục cần xử lý">
    {state.queue.map((item, index) => {
      const label = tree[item.target]?.label || item.target
      const current = item.target === state.target
      const done = resolved.includes(item.target)
      const off = skipped.includes(item.target)
      const mark = done ? '✓' : off ? '–' : index + 1

      return <li key={item.target} className={[current && 'current', done && 'done', off && 'skipped'].filter(Boolean).join(' ')}>
        <button
          type="button"
          className="area-pick"
          disabled={current}
          aria-current={current ? 'step' : undefined}
          aria-label={current ? `Mục đang chẩn đoán: ${label}` : off ? `Ôn lại: ${label}` : `Chuyển sang: ${label}`}
          title={current ? 'Mục đang chẩn đoán' : off ? `Ôn lại: ${label}` : `Chuyển sang: ${label}`}
          onClick={() => (off ? onRestore(item) : onPick(item))}
        >
          <span className="area-mark">{mark}</span>{label}
        </button>
        {!current && !off && <button type="button" className="area-skip" aria-label={`Bỏ qua mục ${label}`} title="Không ôn mục này" onClick={() => onSkip(item)}>×</button>}
      </li>
    })}
  </ol>
}

function QuizResult({ session, state, onExplain, onDiagnose, onComplete }) {
  const correct = state.records.filter(record => record.correct).length
  const weak = state.records.some(record => !record.correct || record.flag === 'slow')
  return (
    <section>
      <div className="result-summary"><strong>{correct}/{state.records.length}</strong><div><h2>Kết quả bài quiz</h2><p>Tổng thời gian {fmt(state.records.reduce((sum, record) => sum + record.sec, 0))}</p></div></div>
      {weak ? (
        <section className="result-next">
          <AreasOverview session={session} state={state} />
          <h3 className="choice-title">Bạn muốn làm gì tiếp?</h3><div className="review-choices"><button onClick={onExplain}><span className="square-icon">✦</span><h2>Giải thích đáp án</h2><p>Hiểu mình sai điều gì và vì sao phương án kia chưa phù hợp.</p><strong>Xem giải thích →</strong></button><button onClick={onDiagnose}><span className="square-icon peach">◎</span><h2>Tìm phần nền bị hổng</h2><p>Tổng hợp toàn bộ tín hiệu để kiểm tra kiến thức nền.</p><strong>Bắt đầu chẩn đoán →</strong></button></div></section>
      ) : (
        <Feedback title="Bạn trả lời đúng và dứt khoát tất cả câu hỏi."><Button onClick={onComplete}>Hoàn thành phiên →</Button></Feedback>
      )}
      <AnswerReview items={session.questions} records={state.records} tree={session.tree} />
    </section>
  )
}

function AnswerReview({ items, records, tree, showExplanation = false }) {
  const reviewKey = records.map((record, index) => [
    items[index]?.id || items[index]?.node || index,
    record.node,
    record.sel,
    record.correct,
    record.flag,
    record.sec,
  ].join(':')).join('|')

  return <AnswerReviewContent key={`${showExplanation}:${reviewKey}`} items={items} records={records} tree={tree} showExplanation={showExplanation} />
}

function AnswerReviewContent({ items, records, tree, showExplanation }) {
  const [expanded, setExpanded] = useState(() => new Set(showExplanation ? records.map((_, index) => index) : []))

  function toggleExplanation(index) {
    setExpanded(previous => {
      const next = new Set(previous)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return <div className="answer-review">{records.map((record, index) => {
    const question = items[index] || {}
    const isExpanded = expanded.has(index)
    const explanationId = `answer-explanation-${index}`
    return <section className={`review-answer ${record.correct ? record.flag === 'slow' ? 'shaky' : 'ok' : 'bad'}`} key={`${record.node}-${index}`}>
      <div className="review-answer-head"><strong>{record.correct ? '✓' : record.flag === 'skip' ? '–' : '×'} Câu {index + 1}</strong><span>⏱ {fmt(record.sec)}</span></div>
      <p>{question.text || question.q}</p>
      <small>{record.sel === null ? 'Bạn đã bỏ trống' : `Bạn chọn: ${question.options?.[record.sel] || `Phương án ${record.sel + 1}`}`}</small>
      {!record.correct && record.answer !== null && record.answer !== undefined && <small>Đáp án: <b>{question.options?.[record.answer] || `Phương án ${record.answer + 1}`}</b></small>}
      {FLAG_TEXT[record.flag] && <p className={`signal ${record.flag}`}>{FLAG_TEXT[record.flag]}</p>}
      {isExpanded && <CitationScope><div className="answer-explanation" id={explanationId}><strong>Vì sao?</strong><p><CitedText text={record.why || 'Phần giải thích chưa sẵn sàng.'} /></p>{record.trap && <p><b>Bẫy:</b> <CitedText text={record.trap} /></p>}{tree?.[record.node]?.page && <SourceCitation source={tree[record.node].page} />}</div></CitationScope>}
      <button
        type="button"
        className="explanation-toggle"
        aria-expanded={isExpanded}
        aria-controls={explanationId}
        onClick={() => toggleExplanation(index)}
      >
        <span className="explanation-bean"><CoffeeBeanIcon /></span>
        <span className="explanation-label">{isExpanded ? 'Ẩn giải thích' : 'Giải thích'}</span>
      </button>
    </section>
  })}</div>
}

function AnalysisPanel({ session, state, onAccept, onPlan, onUpdate }) {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef(null)
  const chatEndRef = useRef(null)
  const open = Boolean(state.chatOpen)
  const chat = state.chat || []
  const targetRecords = state.records.filter(record => state.hits.includes(record.node))

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [chat, sending])

  async function send(message) {
    if (!message.trim() || sending) return
    const userMessage = { me: true, text: message.trim() }
    const nextChat = [...chat, userMessage]
    onUpdate({ chat: nextChat, chatOpen: true })
    setDraft('')
    setSending(true)
    try {
      const { reply, usage } = await learningService.chat({ session, target: state.target, records: targetRecords, message: message.trim(), history: chat })
      onUpdate({
        chat: [...nextChat, { me: false, text: reply, usage }],
        trace: [...state.trace, { t: 'Học viên hỏi lại', d: message.trim() }],
      })
    } catch {
      onUpdate({ chat: [...nextChat, { me: false, text: 'Gemini đang tạm thời chưa phản hồi. Bạn vui lòng thử lại sau ít phút.' }] })
    } finally {
      setSending(false)
    }
  }

  return <section>
    <CitationScope><div className="analysis-card"><span className="eyebrow">TÍN HIỆU THU ĐƯỢC</span><ul>{targetRecords.map((record, index) => <li key={index}>{session.tree[record.node]?.label || record.node} — {FLAG_TEXT[record.flag] || 'đúng'} ({fmt(record.sec)})</li>)}</ul><div className="divider" /><span className="eyebrow">GIẢ THUYẾT</span><h2>{session.tree[state.target]?.label || state.target}</h2><p><CitedText text={state.hypothesis?.hypothesis_text} /></p><p className="muted">Mức chắc chắn: <b>{state.hypothesis?.confidence || 'thấp'}</b><UsageChip usage={state.hypothesis?.usage} /></p>{session.tree[state.target]?.page && <p className="source-line">▤ <CitedText text={session.tree[state.target].page} /></p>}</div></CitationScope>
    <h3 className="choice-title">Bạn thấy suy luận này có hợp lý không?</h3>
    <div className="action-row"><Button onClick={onAccept}>Hợp lý — kiểm tra câu nền →</Button><Button variant="secondary" onClick={onPlan}>Hợp lý — ôn luôn</Button><Button variant="ghost" onClick={() => onUpdate({ chatOpen: !open })}>Chưa thuyết phục — hỏi thêm</Button></div>
    {open && <section className="chat-panel"><div className="chat">{chat.map((message, index) => <p key={index} className={`bub ${message.me ? 'me' : 'ai'}`}>{message.me ? message.text : <><CitedText text={message.text} /><UsageChip usage={message.usage} /></>}</p>)}{sending && <p className="muted">Đang trả lời…</p>}<span ref={chatEndRef} /></div><div className="chat-compose"><input ref={inputRef} value={draft} disabled={sending} onChange={event => setDraft(event.target.value)} onKeyDown={event => event.key === 'Enter' && !event.isComposing && send(draft)} placeholder="Hỏi về chẩn đoán này…" /><Button disabled={sending || !draft.trim()} onClick={() => send(draft)}>Gửi</Button></div></section>}
  </section>
}

function ReviewPanel({ state, tree, onRetry, onNext, onPlan }) {
  const bad = state.roundRecs.filter(record => !record.correct).length
  const messages = {
    locate: `Bạn chỉ sai ${bad}/${state.roundRecs.length} câu. Lỗ hổng đã được khoanh vùng, không cần leo lên tầng trên.`,
    escalate: `Bạn sai ${bad}/${state.roundRecs.length} câu nền. Nên kiểm tra tiếp “${tree[state.nextTarget]?.label || state.nextTarget}”.`,
    restart: `Bạn sai ngay ở tầng nền và đã chạm giới hạn chẩn đoán. Nên xem lại toàn bài.`,
  }
  return <section>
    <AnswerReview items={state.probeQuestions} records={state.roundRecs} tree={tree} showExplanation />
    <Feedback type={state.decision === 'locate' ? 'success' : 'warning'} title="Hệ thống đọc được gì">{messages[state.decision]}</Feedback>
    <div className="action-row">
      {state.decision === 'escalate' && <Button onClick={onNext}>Kiểm tra tầng tiếp theo →</Button>}
      {state.decision === 'locate' && <Button onClick={() => onPlan('located')}>Xem lộ trình ôn →</Button>}
      {state.decision === 'restart' && <Button onClick={() => onPlan('restart')}>Xem tóm tắt cả bài →</Button>}
      <Button variant="secondary" onClick={onRetry}>↻ Làm lại vòng này</Button>
      {state.decision === 'escalate' && <Button variant="ghost" onClick={() => onPlan('self')}>Mình tự ôn được</Button>}
    </div>
  </section>
}

function PlanPanel({ state, tree, onRetest, onBack }) {
  const plan = state.plan || {}
  const reviewLabel = text => (text || '').replace(/^Nghe lại\b/i, 'Xem lại')
  return <section>
    <CitationScope><div className="plan-hero"><span className="eyebrow">LỘ TRÌNH CÁ NHÂN HÓA</span><h2>{plan.title}</h2><p><CitedText text={plan.why_explanation} /></p><UsageChip usage={plan.usage} /></div></CitationScope>
    <div className="knowledge-list">{(plan.items || []).map((item, index) => <CitationScope key={index}><section className="knowledge-card"><div className="knowledge-number">0{index + 1}</div><div><h2><CitedText text={reviewLabel(item.text)} /></h2>{item.slide_page && <SourceCitation source={item.slide_page} />}</div></section></CitationScope>)}</div>
    {plan.advice_text && <CitationScope><section className="mini-lesson"><span className="eyebrow">AI GỢI Ý CÁCH ÔN</span><p className="pre-line"><CitedText text={plan.advice_text} /></p></section></CitationScope>}
    <section className="trace-card"><h3>Vì sao bạn nhận lộ trình này?</h3><ol>{state.trace.map((entry, index) => <li key={index}><b>{entry.t}:</b> {entry.d}</li>)}</ol></section>
    <div className="action-row"><Button onClick={onRetest}>Mình ôn xong rồi — kiểm tra lại →</Button><Button variant="secondary" onClick={onBack}>Chưa ổn — cần thêm</Button></div>
    <p className="muted small-note">Chỉ báo “đã ôn xong” chưa làm mất cờ lỗ hổng; bạn cần đúng toàn bộ bài kiểm tra lại.</p>
  </section>
}

function RetestResult({ state, tree, nextArea, onNextArea, onPlan, onFeedback, onComplete }) {
  const passed = state.retestRecs.every(record => record.correct)
  return <section>
    <Feedback type={passed ? 'success' : 'error'} title={passed ? `Đã nắm: ${tree[state.target]?.label || state.target}` : 'Bạn thấy ổn rồi, nhưng vẫn còn phần chưa chắc'}>{passed ? 'Bạn trả lời đúng toàn bộ câu kiểm tra lại. Node kiến thức đã chuyển sang trạng thái ổn.' : `Bạn còn sai ${state.retestRecs.filter(record => !record.correct).length}/${state.retestRecs.length} câu. Cờ cần ôn vẫn được giữ.`}</Feedback>
    <AnswerReview items={state.probeQuestions} records={state.retestRecs} tree={tree} showExplanation />
    <Rating value={state.feedback} onSubmit={onFeedback} />
    <div className="action-row">
      {!passed && <Button onClick={onPlan}>Xem lại lộ trình</Button>}
      {nextArea && <Button onClick={onNextArea}>Sang mục tiếp: {tree[nextArea.target]?.label || nextArea.target} →</Button>}
      <Button variant={nextArea || !passed ? 'secondary' : 'primary'} onClick={onComplete}>Kết thúc phiên</Button>
    </div>
    {nextArea && <p className="muted">Bài quiz còn tín hiệu yếu ở mục khác. Kết thúc bây giờ thì những mục đó không được chẩn đoán.</p>}
  </section>
}

// Trích dẫn kiểu bài báo: mỗi mã đoạn [Txx-NNN] là một nút riêng, bấm lại để ẩn.
// Mọi CitedText trong cùng một CitationScope dùng CHUNG một ô nguồn đặt ở cuối khối,
// nên bấm mã trong thân bài hay ở dòng ▤ đều mở ra cùng chỗ.
const CITE_SPLIT_RE = /(\[T\d{2}-\d{3}(?:\s*[,;·]\s*T\d{2}-\d{3})*\])/g
const CITE_CHUNK_RE = /^\[T\d{2}-\d{3}(?:\s*[,;·]\s*T\d{2}-\d{3})*\]$/
const CITE_CODE_RE = /T\d{2}-\d{3}/g
const CitationContext = createContext(null)

export function CitationScope({ children }) {
  const [openCode, setOpenCode] = useState(null)
  const scopeId = useId()
  const toggle = code => setOpenCode(previous => (previous === code ? null : code))

  return <CitationContext.Provider value={{ openCode, toggle, popoverId: `${scopeId}-popover` }}>
    {children}
    {openCode && <SourcePopover id={`${scopeId}-popover`} code={openCode} onClose={() => setOpenCode(null)} />}
  </CitationContext.Provider>
}

function CitedText(props) {
  // Dùng ô nguồn của scope cha nếu có; đứng một mình thì tự dựng scope riêng.
  const scope = useContext(CitationContext)
  if (scope) return <CitedTextBody {...props} scope={scope} />
  return <CitationScope><CitedTextBody {...props} /></CitationScope>
}

function CitedTextBody({ text, className, scope: injected }) {
  const fromContext = useContext(CitationContext)
  const scope = injected || fromContext
  const parts = String(text ?? '').split(CITE_SPLIT_RE)
  if (!parts.some(part => CITE_CHUNK_RE.test(part))) return <span className={className}>{text}</span>

  return <span className={className}>
    {parts.map((part, index) => {
      if (!CITE_CHUNK_RE.test(part)) return <span key={index}>{part}</span>
      // Ngoặc gộp nhiều mã thì tách thành từng nút riêng, bấm được độc lập.
      return part.match(CITE_CODE_RE).map(code => {
        const isOpen = scope.openCode === code
        return <button
          key={`${index}-${code}`}
          type="button"
          className={`citation-ref ${isOpen ? 'open' : ''}`}
          aria-expanded={isOpen}
          aria-controls={scope.popoverId}
          aria-label={`${isOpen ? 'Ẩn' : 'Xem'} nguồn ${code}`}
          onClick={() => scope.toggle(code)}
        >[{code}]</button>
      })
    })}
  </span>
}

// Số token của chính lời gọi AI vừa sinh ra khối này — nhỏ, đặt ngay dưới nội dung.
// Nói thật với học viên bộ câu này từ đâu ra — câu AI vừa sinh hay bộ có sẵn.
function ProbeOrigin({ state }) {
  if (state.probeSource === 'ai') return <> · <span className="probe-origin">câu vừa được AI soạn riêng<UsageChip usage={state.probeUsage} /></span></>
  if (state.probeSource === 'bank') return <> · <span className="probe-origin">bộ câu có sẵn</span></>
  return null
}

function UsageChip({ usage }) {
  if (!usage?.total_tokens) return null
  const seconds = (usage.latency_ms || 0) / 1000
  return <span className="usage-chip" title={`${usage.task} · ${usage.model} · ${usage.total_tokens} token · ${seconds.toFixed(1)}s`}>
    ⇅ {usage.prompt_tokens}↑ {usage.completion_tokens}↓ token · {seconds.toFixed(1)}s
  </span>
}

function SourcePopover({ id, code, onClose }) {
  const [source, setSource] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setSource(null)
    setError('')
    learningService.getSource(code)
      .then(result => { if (!cancelled) setSource(result) })
      .catch(err => { if (!cancelled) setError(err.message || 'Không tải được đoạn nguồn.') })
    return () => { cancelled = true }
  }, [code])

  // Toàn span: ô nguồn có thể nằm trong <p> (bong bóng chat, dòng ▤) mà không sai lồng thẻ.
  return <span className="source-popover" role="note" id={id} aria-label={`Trích nguồn ${code}`}>
    <span className="source-popover-head"><strong>TRÍCH NGUỒN · {code}</strong><button type="button" aria-label="Đóng trích nguồn" onClick={onClose}>×</button></span>
    <span className={`source-popover-body ${error ? 'is-error' : ''}`}>{error || (source ? `“${source.text}”` : 'Đang tải đoạn nguồn…')}</span>
    {source && <small>{source.file} · {code}</small>}
  </span>
}

function SourceCitation({ source }) {
  return <div className="source-citation-wrap"><span aria-hidden="true">▤ </span><CitedTextBody className="source-citation-text" text={source} /></div>
}

function Rating({ value, onSubmit }) {
  const [stars, setStars] = useState(value?.stars || 0)
  const [reasons, setReasons] = useState(value?.reasons || [])
  const options = ['Chung chung', 'Khó hiểu', 'Không đúng chỗ mình hổng', 'Vừa đủ, dùng được']
  if (value) return <section className="rating-card"><h3>Cảm ơn bạn</h3><p>Bạn đã chấm lời tư vấn {value.stars}/5. Đánh giá này không làm thay đổi kết quả kiến thức.</p></section>
  return <section className="rating-card"><h3>Lời tư vấn ôn tập có dùng được không?</h3><div className="rating-stars">{[1, 2, 3, 4, 5].map(number => <button key={number} className={number <= stars ? 'selected' : ''} onClick={() => setStars(number)} aria-label={`${number} sao`}>★</button>)}</div><div className="reason-chips">{options.map(option => <button key={option} className={reasons.includes(option) ? 'selected' : ''} onClick={() => setReasons(previous => previous.includes(option) ? previous.filter(item => item !== option) : [...previous, option])}>{option}</button>)}</div><Button disabled={!stars} onClick={() => onSubmit({ stars, reasons, node: null })}>Gửi đánh giá</Button></section>
}

function Completion({ state, total, onHome }) {
  const correct = state.records.filter(record => record.correct).length
  const answered = state.records.filter(record => record.flag !== 'skip').length
  return <section className="completion"><div className="completion-icon">✓</div><span className="eyebrow">THÊM MỘT BƯỚC TIẾN</span><h2>Phiên học đã hoàn thành</h2><p>Kết quả quiz, lỗ hổng và lần kiểm tra lại đã được lưu vào tiến độ.</p><div className="completion-stats"><div><strong>{correct}/{total}</strong><span>Câu quiz đúng</span></div><div><strong>{answered}/{total}</strong><span>Câu đã trả lời</span></div></div><Button onClick={onHome}>Về trang chủ →</Button></section>
}

function LearningAside({ session, state, tree, onFinish }) {
  const [confirmFinish, setConfirmFinish] = useState(false)

  function finish() {
    setConfirmFinish(false)
    onFinish()
  }

  return <aside className="learning-aside">
    <section className="session-card"><span className="eyebrow">PHIÊN HỌC HIỆN TẠI</span><div className="book-art" aria-hidden="true">▤</div><h3>{session.topic}</h3><p>{session.document.title}</p><div className="divider" /><div className="meta-line"><span>Quiz</span><strong>{session.questions.length} câu</strong></div><div className="meta-line"><span>Nguồn</span><strong>{session.source === 'backend' ? 'Backend' : 'Demo'}</strong></div></section>
    <KnowledgeTree tree={tree} status={state.status} target={state.target} />
    {state.trace.length > 0 && <details className="trace-aside"><summary>Dấu vết quyết định ({state.trace.length})</summary><ol>{state.trace.map((entry, index) => <li key={index}><b>{entry.t}</b><span>{entry.d}</span></li>)}</ol></details>}
    {state.stage !== 'complete' && <button className="text-button muted end-session" onClick={() => setConfirmFinish(true)}>Kết thúc phiên học</button>}
    {confirmFinish && <section className="end-session-confirm" role="alertdialog" aria-modal="true" aria-label="Xác nhận kết thúc phiên học"><strong>Kết thúc phiên học?</strong><p>Kết quả hiện tại sẽ được lưu và bạn không thể tiếp tục phiên này.</p><div className="action-row"><Button onClick={finish}>Kết thúc phiên</Button><Button variant="secondary" onClick={() => setConfirmFinish(false)}>Tiếp tục học</Button></div></section>}
  </aside>
}

function KnowledgeTree({ tree, status, target }) {
  if (!tree.root) return null
  const children = id => Object.values(tree).filter(node => node.parent === id)
  const render = (id, depth = 0) => {
    const item = tree[id]
    if (!item) return null
    const itemStatus = id === target ? 'probing' : status[id]
    return <li key={id} className={`knowledge-node ${itemStatus || ''}`} style={{ '--depth': depth }}><span className="knowledge-dot" /><span>{item.label}</span>{children(id).length > 0 && <ul>{children(id).map(child => render(child.id, depth + 1))}</ul>}</li>
  }
  return <details className="tree-panel" open><summary>Cây tri thức</summary><ul>{render('root')}</ul><p className="tree-legend"><span className="knowledge-dot probing" /> đang kiểm tra <span className="knowledge-dot weak" /> cần ôn <span className="knowledge-dot ok" /> đã ổn</p></details>
}

function Thinking() {
  return <div className="adaptive-loading" role="status"><span className="loading-orbit" /><div><strong>Đang phân tích…</strong><p>Kết nối tín hiệu với cây tri thức và chuẩn bị bước tiếp theo.</p></div></div>
}

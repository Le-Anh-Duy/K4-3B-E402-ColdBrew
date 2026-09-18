import { useEffect, useReducer, useRef, useState } from 'react'
import { Button, Feedback, ProgressBar, QuestionCard } from '../components/UI'
import { learningService } from '../services/learningService'
import { initialFlow, learningReducer } from '../services/learningFlow'

export default function LearningScreen({ session, isActive = true, onComplete, onHome }) {
  const [state, dispatch] = useReducer(learningReducer, initialFlow)
  const [support, setSupport] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const elapsed = useRef(0)
  const startedAt = useRef(null)
  const { stage, index, round, selected, result, explained, answers } = state
  const total = session.questions.length
  const answered = Object.keys(answers).length
  const correct = Object.values(answers).filter(Boolean).length
  useEffect(() => { let active = true; learningService.getSupport(session.topic, { sessionId: session.id, questionId: session.questions[index].id }).then(s => { if (active) setSupport(s) }).catch(e => { if (active) setError(e.message) }); return () => { active = false } }, [session.id, session.topic, index])
  async function finish() {
    await onComplete({ id: session.id, topic: session.topic, total, answered, correct, weak: correct < answered ? [session.topic] : [], date: new Date().toISOString() })
    setSaved(true)
  }
  useEffect(() => { if (stage === 'complete') finish().catch(e => setError(`Chưa lưu được phiên: ${e.message}`)) }, [stage])
  useEffect(() => {
    if (stage !== 'complete') learningService.saveProgress(session.id, { stage, index, round, selected }).catch(e => setError(`Chưa đồng bộ được tiến độ: ${e.message}`))
  }, [stage, index, round, selected, result, session.id])
  async function go(nextStage) {
    setError('')
    if (['summary', 'deep'].includes(nextStage)) {
      setBusy(true)
      try { setSupport(await learningService.getReview(session.topic, { sessionId: session.id, questionId: session.questions[index].id })) }
      catch (e) { setError(e.message); return }
      finally { setBusy(false) }
    }
    dispatch({ type: 'go', stage: nextStage })
  }
  function next() { dispatch({ type: 'next', total }) }
  const question = stage === 'quiz' || stage === 'retryOriginal' ? session.questions[index] : stage === 'similar' ? support?.similar : stage === 'recheck' ? support?.recheck : stage === 'prerequisite' ? support?.checks[round] : stage === 'deep' ? support?.checks[round] : null
  useEffect(() => { elapsed.current = 0 }, [question?.id, stage])
  useEffect(() => {
    if (!isActive || result || !question) return
    startedAt.current = performance.now()
    return () => { if (startedAt.current !== null) elapsed.current += performance.now() - startedAt.current; startedAt.current = null }
  }, [question?.id, stage, isActive, result])
  async function grade() {
    if (selected === null || busy) return
    setBusy(true); setError('')
    const timeSec = (elapsed.current + (startedAt.current === null ? 0 : performance.now() - startedAt.current)) / 1000
    try { dispatch({ type: 'grade', result: await learningService.grade(question.id, selected, { sessionId: session.id, timeSec, stage }) }) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function explain() {
    setBusy(true); setError('')
    try { dispatch({ type: 'explanation', result: await learningService.explain(question.id, result, { sessionId: session.id }) }) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const labels = { quiz: 'Quiz ngắn', similar: 'Thử một ví dụ khác', prerequisite: `Kiểm tra nhanh — Vòng ${round + 1}/2`, recheck: 'Quay lại concept ban đầu', retryOriginal: 'Thử lại câu ban đầu', summary: 'Tổng hợp kiến thức', deep: 'Ôn tập chuyên sâu', reviewChoice: 'Chọn cách ôn tập', complete: 'Phiên học của bạn' }
  const phase = stage === 'quiz' ? 0 : ['similar', 'prerequisite', 'recheck'].includes(stage) ? 1 : 2
  const actions = <div className="action-row"><Button onClick={next}>Quay lại Quiz →</Button><Button variant="ghost" onClick={() => go('complete')}>Kết thúc</Button></div>
  if (!support && !error) return <div className="empty-state" role="status">Đang chuẩn bị kiến thức cho bạn…</div>
  return <div className="learning-layout"><div className="learning-top"><button className="text-button muted" onClick={onHome}>← Trang chủ <span className="desktop-only">· giữ phiên hiện tại</span></button><span className="pill">{session.document.title}</span></div><div className="learning-grid"><div className="learning-content"><div className="stepper" aria-label="Các bước học tập">{['Làm quiz', 'Hiểu lỗ hổng', 'Ôn đúng chỗ'].map((s, i) => <div className={phase === i ? 'current' : phase > i ? 'done' : ''} key={s}><span>{phase > i ? '✓' : `0${i + 1}`}</span>{s}</div>)}</div><div className="learning-title"><span className="eyebrow">{session.topic}</span><h1>{labels[stage]}</h1><p className="muted">{stage === 'quiz' ? 'Cứ chọn theo những gì bạn hiểu. Mỗi câu trả lời là một gợi ý để học tốt hơn.' : stage === 'prerequisite' ? `Kiến thức nền đang kiểm tra: ${support?.foundations[round]}` : stage === 'summary' ? 'Phần kiến thức liên quan được tổng hợp trong bài' : stage === 'deep' ? `Cùng củng cố: ${support?.foundations[round]}` : 'Đi từng bước nhỏ để hiểu rõ hơn.'}</p></div>
      {error && <Feedback type="error" title={error} />}
      {question && <><div className="question-meta"><span>{stage === 'quiz' ? `Câu ${index + 1}/${total}` : stage === 'prerequisite' ? `Vòng ${round + 1}/2 · Câu 1/1` : 'Câu hỏi củng cố · 1/1'}</span><span>{stage === 'quiz' ? `${answered}/${total} câu đã kiểm tra` : 'Không tính vào điểm quiz ban đầu'}</span></div><ProgressBar value={stage === 'quiz' ? answered / total * 100 : result ? 100 : 0} />
      {stage === 'deep' && <section className="mini-lesson"><span className="eyebrow">ĐỌC CHẬM MỘT CHÚT</span><h2>{support.cards[round + 1].title}</h2><p>{support.cards[round + 1].definition}</p><div className="example"><strong>Ví dụ dễ nhớ</strong><p>{support.cards[round + 1].example}</p></div><small>Nội dung minh họa · chưa liên kết slide gốc.</small></section>}
      <QuestionCard question={question} selected={selected} onSelect={value => dispatch({ type: 'select', value })} result={result} busy={busy} onCheck={grade} />
      {result && <div className="result-area">
        {stage === 'quiz' && (result.correct ? <><Feedback title="Chính xác!">{result.explanation}</Feedback><div className="action-row"><Button onClick={next}>{index + 1 === total ? 'Xem kết quả' : 'Câu tiếp theo'} →</Button></div></> : <><Feedback type="error" title="Chưa chính xác — cùng tìm hiểu nhé.">Đáp án đúng đã được đánh dấu màu xanh.</Feedback>{!explained ? <Button variant="secondary" onClick={() => dispatch({ type: 'explain' })}>Xem giải thích ↓</Button> : <section className="explanation-panel"><span className="eyebrow">VÌ SAO ĐÁP ÁN NÀY ĐÚNG?</span><p>{result.explanation}</p><div className="diagnosis"><span className="pill">Nhận định demo · chưa đủ căn cứ</span><h3>Có vẻ bạn hiểu concept nhưng có thể đang nhầm khi áp dụng.</h3><p>Một câu sai chưa đủ để kết luận. Thử thêm một ví dụ hoặc kiểm tra kiến thức nền nhé.</p></div><div className="action-row"><Button onClick={() => go('similar')}>Thử một ví dụ khác →</Button><Button variant="secondary" onClick={() => go('prerequisite')}>Tiếp tục ôn</Button></div></section>}</>)}
        {stage === 'similar' && (result.correct ? <><Feedback title="Có vẻ bạn đã hiểu concept nhưng đã nhầm hoặc áp dụng sai ở câu trước.">{result.explanation}</Feedback>{actions}</> : <><Feedback type="warning" title="Có thể bạn đang thiếu một số kiến thức nền liên quan.">{result.explanation}</Feedback><Button onClick={() => go('prerequisite')}>Kiểm tra kiến thức nền →</Button></>)}
        {stage === 'prerequisite' && (result.correct ? <><Feedback title="Bạn đã nắm được kiến thức nền này.">Cùng quay lại concept ban đầu với một câu tương đương.</Feedback><Button onClick={() => go('recheck')}>Kiểm tra lại concept →</Button></> : <><Feedback type="warning" title={round === 0 ? 'Phần kiến thức nền này chưa thật vững.' : 'Mình dừng kiểm tra tại đây nhé.'}>{result.explanation}{round === 1 && <p>Đã kiểm tra đủ 2 vòng. Hãy dành một chút thời gian để ôn lại.</p>}</Feedback><Button onClick={() => dispatch({ type: 'nextRound' })}>{round === 0 ? 'Tiếp tục vòng 2' : 'Chọn cách ôn tập'} →</Button></>)}
        {['recheck', 'retryOriginal'].includes(stage) && (result.correct ? <><Feedback title="Chính xác! Bạn đã kết nối được kiến thức.">{result.explanation}</Feedback>{actions}</> : <><Feedback type="warning" title="Concept này vẫn cần thêm một chút củng cố.">{result.explanation}</Feedback><div className="action-row"><Button onClick={() => go('summary')}>Tổng hợp kiến thức</Button><Button variant="secondary" onClick={() => go('deep')}>Ôn tập chuyên sâu</Button></div></>)}
        {stage === 'deep' && (result.correct ? <><Feedback title="Bạn đã nắm được phần kiến thức cơ bản này.">{result.explanation}</Feedback><div className="action-row"><Button onClick={next}>Quay lại Quiz ban đầu →</Button><Button variant="secondary" onClick={() => go('complete')}>Kết thúc phiên học</Button></div></> : <><Feedback type="error" title={`Bạn đã trả lời sai kiến thức cơ bản và cần ôn tập lại phần ${support.foundations[round]}.`}>{result.explanation}</Feedback><div className="action-row"><Button onClick={() => go('deep')}>Ôn lại phần này ↻</Button><Button variant="ghost" onClick={() => go('complete')}>Kết thúc</Button></div></>)}
      </div>}</>}
      {stage === 'reviewChoice' && <><Feedback type="warning" title="Có vẻ bạn đang thiếu một số kiến thức nền liên quan.">Bạn muốn xem lại theo cách nào?</Feedback><div className="review-choices"><button onClick={() => go('summary')}><span className="square-icon">▤</span><h2>Tổng hợp kiến thức</h2><p>Xem lại bức tranh chung, định nghĩa và ví dụ ngắn.</p><strong>Xem tổng hợp →</strong></button><button onClick={() => go('deep')}><span className="square-icon peach">◎</span><h2>Ôn tập chuyên sâu</h2><p>Đi chậm hơn với bài học nhỏ và câu hỏi kiến thức nền.</p><strong>Bắt đầu ôn tập →</strong></button></div></>}
      {stage === 'summary' && <><div className="knowledge-list">{support.cards.map((card, i) => <section className="knowledge-card" key={card.title}><div className="knowledge-number">0{i + 1}</div><div><span className="eyebrow">{card.tag}</span><h2>{card.title}</h2><p>{card.definition}</p><div className="example"><strong>Ví dụ</strong><p>{card.example}</p></div><small>Nguồn slide: chưa được cung cấp · nội dung demo</small></div></section>)}</div><div className="action-row"><Button onClick={() => go('retryOriginal')}>Thử lại câu ban đầu</Button><Button variant="secondary" onClick={next}>Quay lại Quiz</Button><Button variant="secondary" onClick={() => go('deep')}>Ôn tập chuyên sâu</Button><Button variant="ghost" onClick={() => go('complete')}>Kết thúc</Button></div></>}
      {stage === 'complete' && <section className="completion"><div className="completion-icon">✓</div><span className="eyebrow">THÊM MỘT BƯỚC TIẾN</span><h2>{answered === total ? 'Bạn đã hoàn thành quiz!' : 'Phiên học đã kết thúc'}</h2><p>Mỗi lần nhìn lại là một lần hiểu rõ hơn.</p><div className="completion-stats"><div><strong>{correct}/{answered}</strong><span>Câu đã trả lời đúng</span></div><div><strong>{answered}/{total}</strong><span>Câu quiz đã làm</span></div></div>{correct < answered && <p className="notice">Gợi ý tiếp tục củng cố: {session.topic}. Đây là kết quả demo, chưa phải chẩn đoán từ backend.</p>}<Button onClick={onHome}>Về trang chủ →</Button></section>}
    </div><aside className="learning-aside"><section className="session-card"><span className="eyebrow">PHIÊN HỌC HIỆN TẠI</span><div className="book-art" aria-hidden="true">▤</div><h3>{session.topic}</h3><p>{session.document.title}</p><div className="divider" /><div className="meta-line"><span>Quiz ngắn</span><strong>{total} câu</strong></div><div className="meta-line"><span>Đã trả lời</span><strong>{answered}/{total}</strong></div><ProgressBar value={answered / total * 100} /><div className="aside-note">✧ <span>Không sao nếu chưa đúng.<br />Đó là nơi việc học bắt đầu.</span></div></section><section className="quiet-note"><strong>Vì sao có bước kiểm tra nền?</strong><p>Đôi khi điều còn thiếu nằm ở kiến thức trước đó. Chúng mình kiểm tra tối đa 2 vòng để bạn không bị lạc quá xa.</p></section>{stage !== 'complete' && <button className="text-button muted" onClick={() => go('complete')}>Kết thúc phiên học</button>}</aside></div></div>
}

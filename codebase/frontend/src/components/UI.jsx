export function Logo() { return <span className="brand"><span className="brand-mark">c<span>°</span></span>coldbrew<span className="brand-dot">.</span></span> }
export function Button({ children, variant = 'primary', className = '', ...props }) { return <button className={`button ${variant} ${className}`} {...props}>{children}</button> }
export function ProgressBar({ value, label }) { return <div className="progress" role="progressbar" aria-label={label || 'Tiến độ'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{ width: `${value}%` }} /></div> }
export function Feedback({ type = 'success', title, children }) { return <div className={`feedback ${type}`} role="status"><span className="feedback-icon">{type === 'success' ? '✓' : type === 'error' ? '×' : '!'}</span><div><strong>{title}</strong>{children && <div className="feedback-body">{children}</div>}</div></div> }
export function QuestionCard({ question, selected, onSelect, result, busy, onCheck }) {
  return <section className="question-card"><span className="eyebrow">CHỌN MỘT ĐÁP ÁN</span><h2>{question.text}</h2><div className="answers" role="group" aria-label="Các đáp án">{question.options.map((option, i) => {
    const status = result ? i === result.correctIndex ? 'correct' : i === selected ? 'incorrect' : '' : selected === i ? 'selected' : ''
    return <button key={option} className={`answer ${status}`} disabled={!!result || busy} aria-pressed={selected === i} onClick={() => onSelect(i)}><span className="answer-letter">{'ABCD'[i]}</span><span>{option}</span><span className="answer-indicator">{status === 'correct' ? '✓' : status === 'incorrect' ? '×' : status === 'selected' ? '●' : ''}</span></button>
  })}</div>{!result && <div className="question-footer"><span>Chọn đáp án bạn cho là phù hợp nhất.</span><Button disabled={selected === null || busy} onClick={onCheck}>{busy ? 'Đang kiểm tra…' : 'Kiểm tra'} <span>→</span></Button></div>}</section>
}

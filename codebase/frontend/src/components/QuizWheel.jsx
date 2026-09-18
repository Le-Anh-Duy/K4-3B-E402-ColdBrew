import { useEffect, useRef, useState } from 'react'

const MIN_QUESTIONS = 5
const MAX_QUESTIONS = 20
const SEGMENT_COUNT = MAX_QUESTIONS - MIN_QUESTIONS + 1
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT

export function pickUniformQuizCount() {
  if (globalThis.crypto?.getRandomValues) {
    const sample = new Uint32Array(1)
    globalThis.crypto.getRandomValues(sample)
    return MIN_QUESTIONS + (sample[0] % SEGMENT_COUNT)
  }
  return MIN_QUESTIONS + Math.floor(Math.random() * SEGMENT_COUNT)
}

export default function QuizWheel({ value, onChange, disabled = false }) {
  const initialAngle = -((value - MIN_QUESTIONS) * SEGMENT_ANGLE + SEGMENT_ANGLE / 2)
  const [rotation, setRotation] = useState(initialAngle)
  const [spinning, setSpinning] = useState(false)
  const [announcedValue, setAnnouncedValue] = useState(value)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function spin() {
    if (spinning || disabled) return
    const nextValue = pickUniformQuizCount()
    const targetAngle = -((nextValue - MIN_QUESTIONS) * SEGMENT_ANGLE + SEGMENT_ANGLE / 2)

    setSpinning(true)
    setRotation(previous => {
      const currentAngle = ((previous % 360) + 360) % 360
      const normalizedTarget = ((targetAngle % 360) + 360) % 360
      const extraTurn = (normalizedTarget - currentAngle + 360) % 360
      return previous + 5 * 360 + extraTurn
    })

    timerRef.current = setTimeout(() => {
      setAnnouncedValue(nextValue)
      onChange(nextValue)
      setSpinning(false)
    }, 2400)
  }

  return (
    <div className="quiz-wheel-block">
      <div className="quiz-wheel-shell">
        <span className="quiz-wheel-pointer" aria-hidden="true" />
        <div
          className={`quiz-wheel${spinning ? ' is-spinning' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
          aria-hidden="true"
        >
          {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
            <span
              key={index + MIN_QUESTIONS}
              className="quiz-wheel-number"
              style={{ '--segment-index': index }}
            >
              {index + MIN_QUESTIONS}
            </span>
          ))}
        </div>
        <div className="quiz-wheel-hub" aria-hidden="true">
          <strong>{spinning ? '…' : value}</strong>
          <span>câu</span>
        </div>
      </div>
      <div className="quiz-wheel-copy">
        <span className="eyebrow">VÒNG QUAY SỐ CÂU</span>
        <strong>{spinning ? 'Đang chọn số câu…' : `${value} câu quiz`}</strong>
        <p>Mỗi số từ 5 đến 20 có xác suất xuất hiện như nhau.</p>
        <div className="count-options">
          <button type="button" onClick={spin} disabled={spinning || disabled}>
            <span aria-hidden="true">↻</span>
            {spinning ? 'Đang quay…' : 'Quay số câu'}
          </button>
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          {spinning ? 'Vòng quay đang quay' : `Kết quả vòng quay: ${announcedValue} câu`}
        </span>
      </div>
    </div>
  )
}

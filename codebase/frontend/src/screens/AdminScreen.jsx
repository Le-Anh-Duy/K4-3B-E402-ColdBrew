import { useEffect, useRef, useState } from 'react'
import { Button, Feedback, Logo } from '../components/UI'
import { apiAdminLogin, apiAdminStatus, apiAdminUploadTranscripts } from '../api'

// Token chỉ sống trong tab đang mở: đóng tab là mất, không rơi lại localStorage.
const TOKEN_KEY = 'coldbrew-admin-token'

function readToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

const fmtBytes = bytes => `${(bytes / 1024).toFixed(bytes > 1024 * 1024 ? 1 : 0)} ${bytes > 1024 * 1024 ? 'MB' : 'KB'}`
const fmtNumber = value => (value || 0).toLocaleString('vi-VN')

export default function AdminScreen({ onExit }) {
  const [token, setToken] = useState(readToken)
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(!!readToken())
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = readToken()
    if (!saved) return undefined
    let cancelled = false
    apiAdminLogin(saved)
      .then(() => { if (!cancelled) setAuthed(true) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setChecking(false) })
    return () => { cancelled = true }
  }, [])

  async function signIn(event) {
    event.preventDefault()
    setError('')
    setChecking(true)
    try {
      await apiAdminLogin(token)
      try { sessionStorage.setItem(TOKEN_KEY, token) } catch { /* browser storage is optional */ }
      setAuthed(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  function signOut() {
    try { sessionStorage.removeItem(TOKEN_KEY) } catch { /* optional */ }
    setToken('')
    setAuthed(false)
  }

  return <div className="admin-page">
    <header className="admin-head">
      <Logo />
      <div>
        <span className="eyebrow">KHU VỰC QUẢN TRỊ</span>
        <h1>Dữ liệu &amp; chi phí</h1>
      </div>
      <div className="admin-head-actions">
        {authed && <Button variant="ghost" onClick={signOut}>Thoát quyền admin</Button>}
        <Button variant="secondary" onClick={onExit}>← Về ứng dụng</Button>
      </div>
    </header>

    {!authed ? (
      <form className="admin-card admin-login" onSubmit={signIn}>
        <h2>Nhập token quản trị</h2>
        <p className="muted">Token đặt ở biến môi trường <code>ADMIN_TOKEN</code> của backend. Không đặt thì khu vực này khoá hoàn toàn.</p>
        <label>Token<input type="password" value={token} autoComplete="off" onChange={event => setToken(event.target.value)} placeholder="ADMIN_TOKEN" /></label>
        <Button type="submit" disabled={checking || !token.trim()}>{checking ? 'Đang kiểm tra…' : 'Vào trang quản trị'}</Button>
        {error && <Feedback type="error" title={error} />}
      </form>
    ) : (
      <AdminPanels token={readToken() || token} />
    )}
  </div>
}

function AdminPanels({ token }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')

  async function refresh() {
    try { setStatus(await apiAdminStatus(token)); setError('') }
    catch (err) { setError(err.message) }
  }

  useEffect(() => { refresh() }, [token])

  if (error) return <Feedback type="error" title={error} />
  if (!status) return <p className="muted">Đang đọc trạng thái server…</p>

  return <>
    <TranscriptPanel token={token} status={status} onUploaded={refresh} />
    <DataPanel status={status} />
    <UsagePanel usage={status.usage} />
  </>
}

function TranscriptPanel({ token, status, onUploaded }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function upload(event) {
    event.preventDefault()
    const files = [...(inputRef.current?.files || [])]
    if (!files.length) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const response = await apiAdminUploadTranscripts(token, files)
      setResult(response)
      if (inputRef.current) inputRef.current.value = ''
      await onUploaded()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="admin-card">
    <h2>Transcript trên server</h2>
    <p className="muted">Nguồn trích dẫn của mọi câu trả lời AI. Chưa nạp thì nút <code>[T01-060]</code> trong bài sẽ báo không có đoạn nguồn.</p>

    {status.transcripts.length ? (
      <table className="admin-table">
        <thead><tr><th>File</th><th>Số đoạn</th><th>Dung lượng</th></tr></thead>
        <tbody>{status.transcripts.map(item => (
          <tr key={item.name}><td>{item.name}</td><td>{fmtNumber(item.segments)}</td><td>{fmtBytes(item.bytes)}</td></tr>
        ))}</tbody>
        <tfoot><tr><th>Tổng</th><th>{fmtNumber(status.transcript_segments)} đoạn</th><th /></tr></tfoot>
      </table>
    ) : <Feedback type="warning" title="Server chưa có transcript nào">Nạp file lên để phần trích nguồn hoạt động.</Feedback>}

    <form className="admin-upload" onSubmit={upload}>
      <input ref={inputRef} type="file" accept=".md" multiple aria-label="Chọn file transcript" />
      <Button type="submit" disabled={busy}>{busy ? 'Đang nạp…' : 'Nạp lên server'}</Button>
    </form>
    <p className="muted">Chỉ nhận đúng tên <code>transcript-NN-clean.md</code>, tối đa 5MB, mã hoá UTF-8. Trùng tên là ghi đè.</p>

    {error && <Feedback type="error" title={error} />}
    {result && <Feedback type={result.saved.length ? 'success' : 'warning'} title={`Đã nạp ${result.saved.length} file`}>
      {result.saved.map(item => <div key={item.name}>{item.name} — {fmtNumber(item.segments)} đoạn</div>)}
      {result.rejected.map(item => <div key={item.name}>Bỏ qua {item.name}: {item.reason}</div>)}
    </Feedback>}
  </section>
}

function DataPanel({ status }) {
  const rows = [
    ['Node cây tri thức', status.tree_nodes],
    ['Câu hỏi quiz', status.quiz_questions],
    ['Node có câu chẩn đoán', status.probe_nodes],
    ['Phiên học đã lưu', status.sessions],
  ]
  return <section className="admin-card">
    <h2>Dữ liệu khác</h2>
    <div className="admin-stats">{rows.map(([label, value]) => (
      <div key={label}><span>{label}</span><strong>{fmtNumber(value)}</strong></div>
    ))}</div>
    <p className="muted">Đường dẫn transcript: <code>{status.transcript_dir}</code></p>
  </section>
}

function UsagePanel({ usage }) {
  if (!usage?.calls) return <section className="admin-card"><h2>Token đã dùng</h2><p className="muted">Chưa có lời gọi AI nào được ghi sổ.</p></section>
  return <section className="admin-card">
    <h2>Token đã dùng</h2>
    <div className="admin-stats">
      <div><span>Lời gọi</span><strong>{fmtNumber(usage.calls)}</strong></div>
      <div><span>Token vào</span><strong>{fmtNumber(usage.prompt_tokens)}</strong></div>
      <div><span>Token ra</span><strong>{fmtNumber(usage.completion_tokens)}</strong></div>
      <div><span>Tổng</span><strong>{fmtNumber(usage.total_tokens)}</strong></div>
    </div>
    <table className="admin-table">
      <thead><tr><th>Tác vụ</th><th>Lời gọi</th><th>Vào</th><th>Ra</th><th>TB/lời gọi</th><th>Độ trễ TB</th></tr></thead>
      <tbody>{usage.by_task.map(row => (
        <tr key={row.task}>
          <td>{row.task}{row.failed > 0 && <small> · {row.failed} lỗi</small>}</td>
          <td>{fmtNumber(row.calls)}</td>
          <td>{fmtNumber(row.prompt_tokens)}</td>
          <td>{fmtNumber(row.completion_tokens)}</td>
          <td>{fmtNumber(Math.round(row.avg_total_tokens))}</td>
          <td>{(row.avg_latency_ms / 1000).toFixed(1)}s</td>
        </tr>
      ))}</tbody>
    </table>
    <p className="muted">Từ {usage.first_call || '—'} đến {usage.last_call || '—'} (giờ UTC).</p>
  </section>
}

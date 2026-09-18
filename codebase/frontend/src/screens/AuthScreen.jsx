import { useState } from 'react'
import { authService } from '../services/authService'
import { Button, Logo } from '../components/UI'

export default function AuthScreen({ onAuthenticated }) {
  const [register, setRegister] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  function switchMode(nextMode) {
    setRegister(nextMode === 'register')
    setError('')
    setNotice('')
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const values = Object.fromEntries(new FormData(event.currentTarget))
    if (register && values.password !== values.confirm) {
      setError('Mật khẩu xác nhận chưa khớp.')
      setBusy(false)
      return
    }
    try {
      const action = register ? 'register' : 'login'
      onAuthenticated(await authService[action]({ ...values, remember: values.remember === 'on' }))
    } catch {
      setError(register ? 'Không thể tạo tài khoản. Vui lòng thử lại.' : 'Không thể đăng nhập. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Logo />
        <div className="auth-story-body">
          <span className="pill">KHÔNG CHỈ LÀ MỘT BÀI QUIZ</span>
          <h1>Mỗi lỗ hổng nhỏ.<br />Một bước tiến <em>lớn.</em></h1>
          <p>Khám phá điều bạn chưa hiểu, kết nối lại kiến thức nền và tự tin đi tiếp.</p>
          <div className="concept-art" aria-hidden="true">
            <div className="art-line line-one" />
            <div className="art-line line-two" />
            <div className="art-node node-one"><span>✓</span> Kiến thức nền</div>
            <div className="art-node node-two"><span>◎</span> Hiểu bản chất</div>
            <div className="art-node node-three"><span>↗</span> Tự tin áp dụng</div>
            <div className="art-spark">✦</div>
          </div>
          <div className="story-note"><span>01 — 02 — 03</span><p>Quiz ngắn. Chẩn đoán rõ. Ôn tập đúng chỗ.</p></div>
        </div>
        <small>Được thiết kế cho hành trình học của bạn.</small>
      </section>

      <section className={`auth-form-side${register ? ' register-mode' : ''}`}>
        <div className="auth-mobile-logo"><Logo /></div>
        <div className="auth-form-wrap">
          <div className="auth-mode-tabs" role="tablist" aria-label="Chọn hình thức truy cập">
            <button type="button" role="tab" aria-selected={!register} aria-label="Mở form đăng nhập" className={!register ? 'active' : ''} onClick={() => switchMode('login')}>Đăng nhập</button>
            <button type="button" role="tab" aria-selected={register} aria-label="Mở form đăng ký" className={register ? 'active' : ''} onClick={() => switchMode('register')}>Đăng ký</button>
          </div>
          <span className="eyebrow">BẮT ĐẦU TỪ SỰ THẤU HIỂU</span>
          <h2>{register ? 'Tạo hành trình của bạn' : 'Chào mừng bạn trở lại'}</h2>
          <p className="muted">{register ? 'Một bước nhỏ để học tập có định hướng hơn.' : 'Sẵn sàng kết nối những mảnh kiến thức còn thiếu?'}</p>
          <form onSubmit={submit} key={String(register)}>
            {register && <label>Họ và tên<input name="name" autoComplete="name" placeholder="Nguyễn Minh Anh" required maxLength={60} /></label>}
            <label>Email<input name="email" type="email" autoComplete="email" placeholder="ban@example.com" required /></label>
            <label>Mật khẩu<input name="password" type="password" minLength={6} autoComplete={register ? 'new-password' : 'current-password'} placeholder="Ít nhất 6 ký tự" required /></label>
            {register && <label>Xác nhận mật khẩu<input name="confirm" type="password" minLength={6} autoComplete="new-password" placeholder="Nhập lại mật khẩu" required /></label>}
            {!register && <div className="form-options"><label className="checkbox"><input type="checkbox" name="remember" />Ghi nhớ đăng nhập</label><button type="button" className="text-button" onClick={() => setNotice('Đây là đăng nhập demo: dùng email bất kỳ và mật khẩu từ 6 ký tự. Chưa có dịch vụ gửi email khôi phục.')}>Quên mật khẩu?</button></div>}
            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="notice" role="status">{notice}</p>}
            <Button className="full-width" disabled={busy}>{busy ? 'Đang xử lý…' : register ? 'Tạo tài khoản' : 'Đăng nhập'} <span>→</span></Button>
          </form>
          <p className="auth-switch">{register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button type="button" className="text-button" onClick={() => switchMode(register ? 'login' : 'register')}>{register ? 'Đăng nhập' : 'Đăng ký'}</button></p>
          <div className="demo-note"><span>◈</span><p><strong>Bạn đang dùng bản trải nghiệm</strong><br />Dùng email bất kỳ và mật khẩu từ 6 ký tự. Không sử dụng mật khẩu thật; mật khẩu demo không được lưu.</p></div>
        </div>
      </section>
    </main>
  )
}

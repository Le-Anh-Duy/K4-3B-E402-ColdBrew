import { Button, Logo } from './UI'

export default function AppLayout({ user, page, onNavigate, onLogout, children }) {
  return (
    <>
      <div className="app-topbar">
        <header className="app-header">
          <div className="header-inner">
            <a href="#home" onClick={event => { event.preventDefault(); onNavigate('home') }} aria-label="ColdBrew trang chủ"><Logo /></a>
            <nav aria-label="Điều hướng chính">
              {[
                ['home', 'Trang chủ'],
                ['learning', 'Quiz'],
                ['progress', 'Tiến độ'],
              ].map(([id, label]) => (
                <button key={id} className={page === id ? 'active' : ''} onClick={() => onNavigate(id)}>{label}</button>
              ))}
            </nav>
            <details className="profile">
              <summary><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span className="profile-name">{user.name}</span><span>⌄</span></summary>
              <div className="profile-menu"><strong>{user.name}</strong><small>{user.email}</small><Button variant="ghost" onClick={onLogout}>Đăng xuất</Button></div>
            </details>
          </div>
        </header>
        <div className="demo-strip"><span className="status-dot" /> Bản trải nghiệm · Dữ liệu học tập và đăng nhập minh họa</div>
      </div>
      <main className="app-main" id="main-content">{children}</main>
      <footer className="app-footer"><Logo /><span>Hiểu từ gốc. Tiến xa hơn.</span><span>Không cần học lại tất cả, chỉ cần đúng phần.</span></footer>
    </>
  )
}

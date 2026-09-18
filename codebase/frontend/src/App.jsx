import { useEffect, useState } from 'react'
import AppLayout from './components/AppLayout'
import AdminScreen from './screens/AdminScreen'
import AuthScreen from './screens/AuthScreen'
import HomeScreen, { ProgressScreen } from './screens/HomeScreen'
import LearningScreen from './screens/LearningScreen'
import { authService } from './services/authService'
import { learningService } from './services/learningService'
import './styles.css'

const PAGE_KEY = 'coldbrew-page'

function readPage() {
  try { return localStorage.getItem(PAGE_KEY) || 'home' } catch { return 'home' }
}

export default function App() {
  // Khu vực admin đứng ngoài đăng nhập học viên: nó dùng ADMIN_TOKEN riêng.
  const [adminMode, setAdminMode] = useState(() => globalThis.location?.hash === '#admin')
  const [user, setUser] = useState(() => authService.current())
  const [page, setPage] = useState(readPage)
  const [session, setSession] = useState(() => {
    const current = authService.current()
    return current ? learningService.getActiveSession(current.email) : null
  })
  const [history, setHistory] = useState(() => learningService.getHistory(authService.current()?.email))
  const [completed, setCompleted] = useState(false)
  // Chờ khôi phục xong rồi mới dựng LearningScreen — nó chỉ đọc flow state một lần lúc mount.
  const [restoring, setRestoring] = useState(() => !!authService.current())

  // Backend giữ bản chính của phiên; localStorage chỉ để mở lại nhanh khi backend im.
  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    setRestoring(true)
    learningService.restoreSession(user.email)
      .then(restored => { if (!cancelled && restored) setSession(restored) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setRestoring(false) })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    const sync = () => setAdminMode(globalThis.location?.hash === '#admin')
    globalThis.addEventListener?.('hashchange', sync)
    return () => globalThis.removeEventListener?.('hashchange', sync)
  }, [])

  function go(nextPage) {
    setPage(nextPage)
    try { localStorage.setItem(PAGE_KEY, nextPage) } catch { /* browser storage is optional */ }
  }

  function login(nextUser) {
    setUser(nextUser)
    setSession(learningService.getActiveSession(nextUser.email))
    setHistory(learningService.getHistory(nextUser.email))
    go('home')
  }

  function navigate(nextPage) {
    go(nextPage === 'learning' && !session ? 'home' : nextPage)
  }

  async function start(config) {
    const nextSession = await learningService.startQuiz(config, user.email)
    learningService.setActiveSession(user.email, nextSession)
    setSession(nextSession)
    setCompleted(false)
    go('learning')
  }

  async function finish(result) {
    setHistory(await learningService.saveSession(user.email, result))
    setCompleted(true)
  }

  function logout() {
    authService.logout()
    setUser(null)
    setSession(null)
    setHistory([])
    setCompleted(false)
    go('home')
  }

  if (adminMode) return <AdminScreen onExit={() => { globalThis.location.hash = '' }} />
  if (!user) return <AuthScreen onAuthenticated={login} />
  if (restoring) return <AppLayout user={user} page="home" onNavigate={() => {}} onLogout={logout}><p className="muted">Đang khôi phục phiên học…</p></AppLayout>

  const activePage = page === 'learning' && !session ? 'home' : page

  return (
    <AppLayout user={user} page={activePage} onNavigate={navigate} onLogout={logout}>
      {activePage === 'home' && (
        <HomeScreen
          user={user}
          history={history}
          onStart={start}
          activeSession={!completed && session}
          onResume={() => go('learning')}
        />
      )}
      {activePage === 'progress' && <ProgressScreen history={history} onHome={() => go('home')} />}
      {session && (
        <div hidden={activePage !== 'learning'}>
          <LearningScreen
            key={session.id}
            session={session}
            isActive={activePage === 'learning'}
            onComplete={finish}
            onHome={() => go('home')}
          />
        </div>
      )}
    </AppLayout>
  )
}

import { useState } from 'react'
import AppLayout from './components/AppLayout'
import AuthScreen from './screens/AuthScreen'
import HomeScreen, { ProgressScreen } from './screens/HomeScreen'
import LearningScreen from './screens/LearningScreen'
import { authService } from './services/authService'
import { learningService } from './services/learningService'
import './styles.css'

export default function App() {
  const [user, setUser] = useState(() => authService.current())
  const [page, setPage] = useState('home')
  const [session, setSession] = useState(null)
  const [history, setHistory] = useState(() => learningService.getHistory(authService.current()?.email))
  const [completed, setCompleted] = useState(false)
  function login(nextUser) { setUser(nextUser); setHistory(learningService.getHistory(nextUser.email)); setPage('home') }
  function navigate(nextPage) { setPage(nextPage === 'learning' && !session ? 'home' : nextPage) }
  async function start(config) { const nextSession = await learningService.startQuiz(config); setSession(nextSession); setCompleted(false); setPage('learning') }
  async function finish(result) { setHistory(await learningService.saveSession(user.email, result)); setCompleted(true) }
  function logout() { authService.logout(); setUser(null); setSession(null); setHistory([]); setCompleted(false) }
  if (!user) return <AuthScreen onAuthenticated={login} />
  return <AppLayout user={user} page={page} onNavigate={navigate} onLogout={logout}>
    {page === 'home' && <HomeScreen user={user} history={history} onStart={start} activeSession={!completed && session} onResume={() => setPage('learning')} />}
    {page === 'progress' && <ProgressScreen history={history} onHome={() => setPage('home')} />}
    {session && <div hidden={page !== 'learning'}><LearningScreen key={session.id} session={session} isActive={page === 'learning'} onComplete={finish} onHome={() => setPage('home')} /></div>}
  </AppLayout>
}

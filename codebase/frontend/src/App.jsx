import { useEffect, useState } from 'react'

export default function App() {
  const [health, setHealth] = useState('...')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(`ok · ${d.model}`))
      .catch(() => setHealth('backend chưa chạy'))
  }, [])

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>ColdBrew · Knowledge-to-Lesson</h1>
      <p>Backend: {health}</p>
    </main>
  )
}

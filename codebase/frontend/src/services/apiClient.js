// Public URL only. Provider credentials must never be read by the frontend.
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
export const demoMode = import.meta.env.VITE_DATA_MODE === 'demo'

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) controller.abort()
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
    if (!response.ok) {
      // Do not surface provider error bodies, which may contain sensitive details.
      const error = new Error(`Backend trả lỗi HTTP ${response.status}.`)
      error.status = response.status
      throw error
    }
    const data = await response.json().catch(() => null)
    if (data === null) throw new Error('Backend không trả JSON hợp lệ.')
    return data
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Backend phản hồi quá lâu. Vui lòng thử lại.')
    if (error instanceof TypeError) throw new Error('Không kết nối được backend. Kiểm tra server cổng 8000 hoặc VITE_API_BASE_URL.')
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}

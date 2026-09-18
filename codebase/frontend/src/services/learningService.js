import { demoMode } from './apiClient'
import { backendService } from './backendService'
import { demoLearningService } from './demoLearningService'

// The local backend has health and llm-check only. All learning operations are
// explicitly demo until real business endpoints are present in the working tree.
const progressBySession = new Map()
let connection = { state: 'unchecked' }

export const learningService = {
  mode: 'demo',
  getConnectionStatus() { return { ...connection } },
  async checkBackend() {
    try {
      const health = await backendService.health()
      connection = { state: 'available', ...health }
    } catch (error) {
      connection = { state: 'unavailable', message: error.message }
    }
    return this.getConnectionStatus()
  },
  async getCatalog() {
    // Connectivity is independent from demo learning; an offline backend must
    // not break unsupported features that intentionally remain frontend-only.
    if (!demoMode) void this.checkBackend()
    return demoLearningService.getCatalog()
  },
  async startQuiz(config) { return demoLearningService.startQuiz(config) },
  async grade(questionId, answer) { return demoLearningService.grade(questionId, answer) },
  async explain(questionId, result) {
    // /api/llm-check only answers a fixed "ok" prompt, not quiz explanations.
    return { ...result, source: 'demo' }
  },
  async getSupport(topic) { return demoLearningService.getSupport(topic) },
  async getReview(topic) { return demoLearningService.getSupport(topic) },
  async saveProgress(sessionId, progress) {
    const state = { ...progress }
    progressBySession.set(sessionId, state)
    return { source: 'demo', sessionId, state }
  },
  async readSession(sessionId) {
    const state = progressBySession.get(sessionId)
    if (!state) throw new Error('Không có phiên demo trong bộ nhớ. Backend hiện chưa có API khôi phục phiên.')
    return { source: 'demo', sessionId, state: { ...state } }
  },
  getHistory(email) {
    try { return JSON.parse(localStorage.getItem(`coldbrew-history:${email}`) || '[]') } catch { return [] }
  },
  async saveSession(email, session) {
    const updated = [session, ...this.getHistory(email).filter(s => s.id !== session.id)].slice(0, 20)
    try { localStorage.setItem(`coldbrew-history:${email}`, JSON.stringify(updated)) } catch { /* demo history is optional */ }
    progressBySession.delete(session.id)
    return updated
  },
}

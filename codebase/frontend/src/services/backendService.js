import { apiRequest } from './apiClient'

// Only routes declared in the backend working tree, not routes from other refs.
// Never replace a failed live check with a mock success.
export const backendService = {
  async health(options) {
    const data = await apiRequest('/api/health', options)
    if (data?.ok !== true || typeof data.model !== 'string') {
      throw new Error('Backend trả dữ liệu health không hợp lệ.')
    }
    return { ok: data.ok, model: data.model }
  },
  async checkLlm(options) {
    const data = await apiRequest('/api/llm-check', options)
    if (typeof data?.reply !== 'string' || !data.reply.trim()) {
      throw new Error('Backend chưa trả nội dung từ LLM.')
    }
    return { reply: data.reply }
  },
}

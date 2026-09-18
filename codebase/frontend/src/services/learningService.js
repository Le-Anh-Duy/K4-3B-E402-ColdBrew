import { apiRequest, demoMode } from './apiClient'
import { demoLearningService } from './demoLearningService'
import { businessSupport, businessQuestions } from '../mocks/businessSupport'

const prefix = '/api/v0'
let catalogCache = null
let active = null
const publicQuestion = ({ correct, explanation, ...rest }) => rest
const withSource = (text, source) => [text, source ? `Nguồn: ${source}` : ''].filter(Boolean).join('\n')

async function getCatalogData() {
  if (catalogCache) return catalogCache
  const [graph, questions] = await Promise.all([apiRequest(`${prefix}/graph/tree`), apiRequest(`${prefix}/quiz`)])
  if (!graph?.nodes?.root || !Array.isArray(questions) || !questions.length) throw new Error('Backend chưa cung cấp cây kiến thức và quiz hợp lệ.')
  const root = graph.nodes.root
  // The server has one fixed document, not a document-list endpoint. Derive only
  // actual topics with at least three questions; do not invent documents/questions.
  const topicNodes = Object.values(graph.nodes).filter(n => n.parent === 'root' && questions.filter(q => isWithin(q.node, n.id, graph.nodes)).length >= 3)
  const topicMap = { 'Ôn tập toàn bài': root.id, ...Object.fromEntries(topicNodes.map(n => [n.label, n.id])) }
  const document = { id: root.id, title: root.label, label: root.label, topics: Object.keys(topicMap), source: root.page }
  catalogCache = { document, topicMap, nodes: graph.nodes, questions }
  return catalogCache
}
function isWithin(nodeId, ancestor, nodes) {
  const seen = new Set()
  while (nodeId && !seen.has(nodeId)) {
    if (nodeId === ancestor) return true
    seen.add(nodeId); nodeId = nodes[nodeId]?.parent
  }
  return false
}
function requireSession(sessionId) {
  if (!active || (sessionId && active.id !== sessionId)) throw new Error('Phiên học không còn hoạt động. Hãy mở lại quiz.')
  return active
}
function sessionState(context, progress = {}) {
  return {
    stage: progress.stage || 'quiz', records: context.records.filter(Boolean),
    target: context.target, round: progress.round || 0, retry: 0,
    hits: context.records.filter(r => r && !r.correct).map(r => r.node),
    round_recs: [], decision: null, next_target: null,
    trace: context.trace, status: { source: 'api-quiz/demo-practice', ui_topic: context.topic, ui_index: String(progress.index || 0), ui_selected: JSON.stringify(progress.selected ?? null), ui_question_ids: JSON.stringify(context.selectedIds) },
    verdict: progress.stage === 'complete' ? 'self' : null,
  }
}
async function persist(context, progress) {
  // Serialize saves to prevent a late response from overwriting newer state.
  context.saveQueue = context.saveQueue.catch(() => {}).then(() => apiRequest(`${prefix}/session/${context.id}`, { method: 'PUT', body: sessionState(context, progress) }))
  return context.saveQueue
}
export const learningService = {
  mode: demoMode ? 'demo' : 'hybrid',
  async getCatalog() {
    if (demoMode) return demoLearningService.getCatalog()
    const data = await getCatalogData()
    return [data.document]
  },
  async startQuiz(config) {
    if (demoMode) return demoLearningService.startQuiz(config)
    const data = await getCatalogData()
    const target = data.topicMap[config.topic]
    if (config.documentId !== data.document.id || !target) throw new Error('Chủ đề không thuộc tài liệu backend.')
    const candidates = data.questions.filter(q => isWithin(q.node, target, data.nodes))
    if (candidates.length < Number(config.count)) throw new Error(`Chủ đề này hiện có ${candidates.length} câu từ backend. Vui lòng chọn 3 câu hoặc Ôn tập toàn bài.`)
    const chosen = candidates.slice(0, Number(config.count))
    const created = await apiRequest(`${prefix}/session`, { method: 'POST' })
    active = { ...data, id: created.session_id, topic: config.topic, selectedIds: chosen.map(q => q.id), picked: data.questions.map(() => null), times: data.questions.map(() => 0), records: [], target: null, trace: [], saveQueue: Promise.resolve() }
    await persist(active, { stage: 'quiz' })
    return { id: active.id, document: data.document, topic: config.topic, source: 'api', questions: chosen.map(q => ({ id: q.id, concept: data.nodes[q.node]?.label || q.node, text: q.q, options: q.options, nodeId: q.node, source: 'api' })) }
  },
  async grade(questionId, answer, options = {}) {
    if (demoMode) return demoLearningService.grade(questionId, answer)
    if (questionId.startsWith('demo-business-')) {
      const q = businessQuestions.find(q => q.id === questionId)
      if (!q) throw new Error('Không tìm thấy câu luyện tập demo.')
      return { correct: answer === q.correct, correctIndex: q.correct, explanation: q.explanation, source: 'demo' }
    }
    const context = requireSession(options.sessionId)
    const position = context.questions.findIndex(q => q.id === questionId)
    if (position < 0) throw new Error('Câu hỏi không thuộc quiz backend.')
    const picked = [...context.picked]; const times = [...context.times]
    picked[position] = answer; times[position] = Math.max(0, Math.round(options.timeSec || 0))
    const graded = await apiRequest(`${prefix}/quiz/grade`, { method: 'POST', body: { picked, times } })
    const record = graded.records?.[position]
    if (!record || !Number.isInteger(record.answer)) throw new Error('Backend trả kết quả chấm không hợp lệ.')
    // Ignore records for unanswered questions. The bulk API calls these "skip";
    // they are not evidence of a learning gap while this UI is still in progress.
    if (options.stage !== 'retryOriginal') {
      context.picked = picked; context.times = times
      context.records[position] = record
    }
    const question = context.questions[position]
    context.target = context.nodes[question.node]?.parent || null
    return { correct: record.correct, correctIndex: record.answer, explanation: record.why || '', trap: record.trap, flag: record.flag, timeSec: record.sec, nodeId: record.node, source: 'api', backendRecord: record }
  },
  async explain(questionId, result, { sessionId } = {}) {
    if (demoMode || result.source !== 'api') return result
    const context = requireSession(sessionId)
    const q = context.questions.find(q => q.id === questionId)
    const r = result.backendRecord
    const explanation = await apiRequest(`${prefix}/ai/explain/single`, { method: 'POST', body: { node_id: q.node, question: q.q, options: q.options, correct_idx: r.answer, selected_idx: r.sel, time_sec: r.sec, flag: r.flag } })
    let diagnosis = null
    // This endpoint explains a supplied target; it does not run pick_target().
    // Use the current question's known parent, and present only a hypothesis.
    if (!r.correct && r.flag !== 'rush' && context.target) {
      const response = await apiRequest(`${prefix}/ai/diagnosis/hypothesis`, { method: 'POST', body: { target_node_id: context.target, hits: [{ node: q.node, label: context.nodes[q.node]?.label || q.node, flag: r.flag, sec: r.sec }], only_slow: false, rushed_any: false } })
      diagnosis = { text: response.hypothesis_text, confidence: response.confidence, detail: response.confidence_explanation }
    }
    return { ...result, explanation: withSource(explanation.why, explanation.slide_page), trap: explanation.trap, timingNote: explanation.timing_note, diagnosis }
  },
  async getSupport(topic, { questionId, sessionId } = {}) {
    if (demoMode) return demoLearningService.getSupport(topic)
    const context = requireSession(sessionId)
    const q = context.questions.find(q => q.id === questionId)
    const data = businessSupport(context.nodes[q?.node]?.parent)
    return { ...data, similar: publicQuestion(data.similar), recheck: publicQuestion(data.recheck), checks: data.checks.map(publicQuestion) }
  },
  async getReview(topic, options = {}) {
    const practice = await this.getSupport(topic, options)
    if (demoMode) return practice
    const context = requireSession(options.sessionId)
    const q = context.questions.find(q => q.id === options.questionId)
    const target = context.nodes[q?.node]?.parent
    if (!target) throw new Error('Chưa xác định được nguồn ôn tập từ cây backend.')
    // Demo probe results must never be sent as a backend diagnosis. "self" is
    // the actual API's supported self-review verdict; no invented scenario.
    const plan = await apiRequest(`${prefix}/ai/plan/generate`, { method: 'POST', body: { verdict: 'self', target_node_id: target, trace: [] } })
    const cards = plan.items.slice(0, 3).map((item, index) => ({ title: context.nodes[target].label, tag: `Nội dung ôn từ backend · ${index + 1}`, definition: item.text, example: '', source: 'api', citation: item.slide_page }))
    return { ...practice, reviewCards: cards, plan, source: 'hybrid' }
  },
  async saveProgress(sessionId, progress) {
    if (demoMode) return
    return persist(requireSession(sessionId), progress)
  },
  async readSession(sessionId) {
    return apiRequest(`${prefix}/session/${encodeURIComponent(sessionId)}`)
  },
  getHistory(email) {
    try { return JSON.parse(localStorage.getItem(`coldbrew-history:${email}`) || '[]') } catch { return [] }
  },
  async saveSession(email, session) {
    if (!demoMode) await this.saveProgress(session.id, { stage: 'complete' })
    const history = this.getHistory(email)
    const updated = [session, ...history.filter(s => s.id !== session.id)].slice(0, 20)
    try { localStorage.setItem(`coldbrew-history:${email}`, JSON.stringify(updated)) } catch { /* history is optional in demo mode */ }
    return updated
  },
}

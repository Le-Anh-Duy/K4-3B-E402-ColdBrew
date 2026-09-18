import {
  apiChatMessage,
  apiCreateSession,
  apiEvaluateRound,
  apiGeneratePlan,
  apiGetHypothesis,
  apiGetProbes,
  apiGetQuiz,
  apiGetTree,
  apiGradeQuiz,
  apiUpdateSession,
} from '../api.js'
import { backendService } from './backendService'
import { demoLearningService } from './demoLearningService'

const ACTIVE_KEY = 'coldbrew-active-session'
const FLOW_KEY = 'coldbrew-flow'
const progressBySession = new Map()
let connection = { state: 'unchecked' }

const normalizeQuestion = (question, source = 'backend') => ({
  ...question,
  text: question.text || question.q || '',
  source,
})

function readJson(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* browser storage is optional */ }
}

function demoTree(session) {
  const topicId = `topic:${session.topic}`
  const nodes = {
    root: { id: 'root', label: session.document.title, parent: null, page: 'Nội dung demo · chưa có nguồn gốc' },
    [topicId]: { id: topicId, label: session.topic, parent: 'root', page: 'Nội dung demo · chưa có nguồn gốc' },
  }
  session.questions.forEach(question => {
    const id = question.node || question.id
    nodes[id] = { id, label: question.concept || question.text, parent: topicId, page: 'Nội dung demo · chưa có nguồn gốc' }
  })
  return nodes
}

function fallbackTarget(records, tree) {
  const missed = records.filter(record => !record.correct)
  const shaky = records.filter(record => record.flag === 'slow')
  const candidates = missed.length ? missed : shaky
  const refusal = reason => ({ target: null, hits: [], missed, shaky, candidates, reason })
  if (!candidates.length) return refusal('Không có tín hiệu yếu nào.')
  if (candidates.every(record => record.flag === 'rush')) {
    return refusal('Các câu sai đều được trả lời quá nhanh; chưa đủ căn cứ để xác định lỗ hổng.')
  }
  const groups = new Map()
  candidates.forEach(record => {
    const parent = tree[record.node]?.parent
    if (parent) groups.set(parent, [...(groups.get(parent) || []), record])
  })
  if (!groups.size) return refusal('Không thể gắn tín hiệu vào cây tri thức.')
  if (!missed.length && [...groups.values()].every(group => group.length < 2)) {
    return refusal('Các câu trả lời chậm nằm rải rác; chưa đủ căn cứ để khoanh vùng.')
  }
  let [target, hits] = [...groups.entries()][0]
  for (const entry of groups.entries()) if (entry[1].length > hits.length) [target, hits] = entry
  const prerequisite = (tree[target]?.prereq || []).find(id => groups.has(id))
  if (prerequisite) [target, hits] = [prerequisite, groups.get(prerequisite)]
  return { target, hits: hits.map(record => record.node), missed, shaky, candidates, reason: null }
}


export const learningService = {
  mode: 'adaptive',
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
    const graph = await apiGetTree()
    if (graph?.nodes?.root) {
      connection = { state: 'available' }
      const root = graph.nodes.root

      const allTopics = [
        'Bài ôn chẩn đoán thích ứng toàn diện (5 câu)',
        'Chẩn đoán liên môn (Cross-session: Kỹ thuật LLM → Sản phẩm AI)',
        'Tất cả chủ đề (Toàn bộ 38 node từ transcript 01–06)',
      ]

      const day1Topics = [
        'Day 1.1 Cơ chế sinh token xác suất & Ảo giác',
        'LLM dự đoán next token theo xác suất, không phải tri thức chắc chắn',
        'Ảo giác (Hallucination) là tất yếu do bias dữ liệu & autoregressive',
        'Giới hạn context window và hiện tượng suy giảm chú ý (Context rot)',
      ]

      const day2Topics = [
        '1.1 Từ yêu cầu mơ hồ đến bài toán cụ thể',
        '1.2 Product manager và project manager',
        '2.1 Vì sao làm sản phẩm AI khó hơn',
        '2.2 Mức độ tự động hoá & Chi phí sai sót (Cost of error)',
        '3.1 Double Diamond: phân kỳ – hội tụ',
        '3.2 Làm đúng cái sai vs làm sai cái đúng',
        '3.3 First principle thinking',
        '3.4 Kỹ thuật khám phá vấn đề',
        '4.1 Ma trận tác động – nỗ lực',
        '4.2 Vòng lặp HCD',
      ]

      return [
        {
          id: 'adaptive-backend',
          title: root.label || 'Toàn bộ khóa học AI20k · Foundation & AI Product (Day 1 & Day 2 · Transcript 01–06)',
          label: 'Cây tri thức tổng hợp toàn diện 6 transcript',
          topics: allTopics,
          chapter: 'All',
          source: 'backend',
        },
        {
          id: 'day-01',
          title: 'Day 01 · Nền tảng kỹ thuật của LLM (Transcript 04, 05, 06)',
          label: 'Bản chất sinh token xác suất, ảo giác & context window',
          topics: day1Topics,
          chapter: 'Day 1',
          source: 'backend',
        },
        {
          id: 'day-02',
          title: 'Day 02 · Xác định bài toán kinh doanh cho AI (Transcript 01, 02, 03)',
          label: 'Double Diamond, bóc tách bài toán, đặc thù sản phẩm & chi phí lỗi',
          topics: day2Topics,
          chapter: 'Day 2',
          source: 'backend',
        },
      ]
    }
    connection = { state: 'unavailable' }
    return demoLearningService.getCatalog()
  },
  async startQuiz(config) {
    const isBackendDoc = config.documentId === 'adaptive-backend' || config.documentId === 'day-01' || config.documentId === 'day-02'
    if (isBackendDoc) {
      const [quiz, graph, remoteSession] = await Promise.all([apiGetQuiz(config.count, config.documentId), apiGetTree(), apiCreateSession()])
      const docTitle = config.documentId === 'day-01'
        ? 'Day 01 · Nền tảng kỹ thuật của LLM (Transcript 04, 05, 06)'
        : config.documentId === 'day-02'
        ? 'Day 02 · Xác định bài toán kinh doanh cho AI (Transcript 01, 02, 03)'
        : (graph?.nodes?.root?.label || 'Toàn bộ khóa học AI20k')

      const rawQuestions = quiz?.length ? quiz.slice(0, config.count || 5) : []

      if (rawQuestions.length) {
        const document = { id: config.documentId, title: docTitle, topics: [config.topic] }
        return {
          id: remoteSession?.session_id || `${Date.now()}`,
          remote: !!remoteSession?.session_id,
          document,
          topic: config.topic,
          source: 'backend',
          tree: graph?.nodes || {},
          questions: rawQuestions.map(question => normalizeQuestion(question, 'backend')),
        }
      }
    }
    const session = await demoLearningService.startQuiz(config)
    const normalized = { ...session, source: 'demo', questions: session.questions.map(question => normalizeQuestion(question, 'demo')) }
    return { ...normalized, tree: demoTree(normalized) }
  },
  async gradeQuiz(session, picked, times) {
    if (session.source === 'backend') {
      const result = await apiGradeQuiz(session.questions.map(question => question.id), picked, times)
      if (result?.records?.length === session.questions.length) return result.records
      throw new Error('Chưa thể chấm bài lúc này. Đáp án của bạn vẫn được giữ để thử lại.')
    }
    return Promise.all(session.questions.map(async (question, index) => {
      const answer = picked[index]
      if (answer === null || answer === undefined) {
        const result = await demoLearningService.grade(question.id, null)
        return { node: question.node || question.id, sel: null, correct: false, sec: times[index] || 0, flag: 'skip', answer: result.correctIndex, why: result.explanation }
      }
      const result = await demoLearningService.grade(question.id, answer)
      const sec = times[index] || 0
      return {
        node: question.node || question.id,
        sel: answer,
        correct: result.correct,
        sec,
        flag: result.correct ? (sec > 25 ? 'slow' : 'ok') : (sec < 3 ? 'rush' : 'wrong'),
        answer: result.correctIndex,
        why: result.explanation,
      }
    }))
  },
  pickTarget(records, tree) { return fallbackTarget(records, tree) },
  async getHypothesis({ session, target, hits, records }) {
    const targetRecords = records.filter(record => hits.includes(record.node))
    if (session.source === 'backend') {
      const result = await apiGetHypothesis({
        target_node_id: target,
        hits: targetRecords.map(record => ({ node: record.node, label: session.tree[record.node]?.label || record.node, flag: record.flag, sec: record.sec })),
        only_slow: targetRecords.length > 0 && targetRecords.every(record => record.correct),
        rushed_any: targetRecords.some(record => record.flag === 'rush'),
      })
      if (result) return result
    }
    return {
      confidence: targetRecords.length >= 2 ? 'trung bình' : 'thấp',
      hypothesis_text: `${targetRecords.length} tín hiệu yếu cùng nằm dưới “${session.tree[target]?.label || target}”. Có thể lỗ hổng nằm ở mục này hoặc phần nền phía trên.`,
    }
  },
  async chat({ session, target, records, message, history }) {
    const targetNode = session.tree[target] || {}
    const result = await apiChatMessage({
      target_node_id: target,
      target_label: targetNode.label || target,
      source_page: targetNode.page || null,
      content_summary: targetNode.content_summary || null,
      weak_signals: records.map(record => ({ node: record.node, label: session.tree[record.node]?.label || record.node, flag: record.flag, sec: record.sec })),
      message,
      history: history.map(item => ({ role: item.me ? 'user' : 'assistant', content: item.text })),
    })
    if (result?.reply) return result.reply
    return 'Gemini đang tạm thời chưa phản hồi. Bạn vui lòng thử lại sau ít phút.'
  },
  async getProbes(session, target) {
    if (session.source === 'backend') {
      const result = await apiGetProbes(target)
      if (result?.questions?.length) return result.questions.map(question => normalizeQuestion(question, 'backend'))
    }
    const support = await demoLearningService.getSupport(session.topic)
    return [...support.checks, support.similar].slice(0, 3).map(question => normalizeQuestion(question, 'demo'))
  },
  async evaluateRound({ session, target, round, questions, picked, times, lastFailed }) {
    if (session.source === 'backend') {
      const result = await apiEvaluateRound({ target_node_id: target, round_num: round, picked, times, last_failed: lastFailed })
      if (result?.records) return result
    }
    const records = await Promise.all(questions.map(async (question, index) => {
      const selected = picked[index]
      if (selected === null || selected === undefined) return { node: target, sel: null, correct: false, sec: times[index] || 0, flag: 'skip' }
      const grade = await demoLearningService.grade(question.id, selected)
      return { node: target, sel: selected, correct: grade.correct, sec: times[index] || 0, flag: grade.correct ? 'ok' : 'wrong', answer: grade.correctIndex, why: grade.explanation }
    }))
    const bad = records.filter(record => !record.correct).length
    return {
      records,
      bad_count: bad,
      slow_count: 0,
      decision: bad <= 1 ? 'locate' : 'restart',
      next_target: null,
      gap: target,
      ceiling: target,
      scenario: bad <= 1 ? 'muc_nong' : 'nen_bai',
    }
  },
  async generatePlan({ session, state }) {
    if (session.source === 'backend') {
      const result = await apiGeneratePlan({
        verdict: state.verdict,
        target_node_id: state.gap || state.target,
        gap_node_id: state.gap,
        ceiling_node_id: state.ceiling || state.target,
        scenario: state.scenario,
        records: state.records,
        trace: state.trace,
      })
      if (result) return result
    }
    const support = await demoLearningService.getSupport(session.topic)
    return {
      title: state.verdict === 'restart' ? 'Nên xem lại bài này từ đầu' : `Lộ trình ôn: ${session.tree[state.target]?.label || session.topic}`,
      items: support.cards.map(card => ({ text: `${card.title}: ${card.definition}`, slide_page: 'Nội dung demo' })),
      why_explanation: 'Lộ trình dự phòng được tạo từ kết quả quiz và vòng kiểm tra nền.',
    }
  },
  getFlow(sessionId) { return readJson(`${FLOW_KEY}:${sessionId}`, progressBySession.get(sessionId) || null) },
  async saveProgress(sessionId, progress, remote = false) {
    progressBySession.set(sessionId, progress)
    writeJson(`${FLOW_KEY}:${sessionId}`, progress)
    if (remote) void apiUpdateSession(sessionId, progress)
    return progress
  },
  clearProgress(sessionId) {
    progressBySession.delete(sessionId)
    try { localStorage.removeItem(`${FLOW_KEY}:${sessionId}`) } catch { /* optional */ }
  },
  getActiveSession(email) { return readJson(`${ACTIVE_KEY}:${email}`) },
  setActiveSession(email, session) { writeJson(`${ACTIVE_KEY}:${email}`, session) },
  clearActiveSession(email) { try { localStorage.removeItem(`${ACTIVE_KEY}:${email}`) } catch { /* optional */ } },
  getHistory(email) { return readJson(`coldbrew-history:${email}`, []) },
  async saveSession(email, session) {
    const updated = [session, ...this.getHistory(email).filter(item => item.id !== session.id)].slice(0, 20)
    writeJson(`coldbrew-history:${email}`, updated)
    this.clearActiveSession(email)
    this.clearProgress(session.id)
    return updated
  },
}

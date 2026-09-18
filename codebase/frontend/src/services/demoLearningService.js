import { banks, catalog, support } from '../mocks/demo.js'
const publicQuestion = ({ correct, explanation, ...rest }) => rest
const allQuestions = () => [...Object.values(banks).flat(), ...Object.values(support).flatMap(s => [s.similar, s.recheck, ...s.checks])]
export const demoLearningService = {
  async getCatalog() { return catalog },
  async startQuiz({ documentId, topic, count }) {
    const document = catalog.find(d => d.id === documentId)
    if (!document?.topics.includes(topic)) throw new Error('Chủ đề không thuộc tài liệu đã chọn.')
    return { id: `${Date.now()}`, document, topic, source: 'demo', questions: banks[topic].slice(0, Number(count)).map(publicQuestion) }
  },
  async grade(questionId, answer) {
    const q = allQuestions().find(item => item.id === questionId)
    if (!q) throw new Error('Không tìm thấy câu hỏi. Vui lòng thử lại.')
    return { correct: q.correct === answer, correctIndex: q.correct, explanation: q.explanation, source: 'demo' }
  },
  async getSupport(topic) {
    const data = support[topic]
    return { ...data, source: 'demo', similar: publicQuestion(data.similar), recheck: publicQuestion(data.recheck), checks: data.checks.map(publicQuestion) }
  },
}

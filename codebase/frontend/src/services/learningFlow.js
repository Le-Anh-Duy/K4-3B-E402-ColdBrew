export const initialFlow = { stage: 'quiz', index: 0, round: 0, selected: null, result: null, explained: false, answers: {} }
export function learningReducer(state, action) {
  switch (action.type) {
    case 'select': return { ...state, selected: action.value }
    case 'grade': return { ...state, result: action.result, answers: state.stage === 'quiz' ? { ...state.answers, [state.index]: action.result.correct } : state.answers }
    case 'explain': return { ...state, explained: true }
    case 'explanation': return { ...state, explained: true, result: action.result }
    case 'go': return { ...state, stage: action.stage, selected: null, result: null, explained: false, round: action.stage === 'prerequisite' ? 0 : state.round }
    case 'nextRound': return { ...state, stage: state.round === 0 ? 'prerequisite' : 'reviewChoice', round: Math.min(1, state.round + 1), selected: null, result: null }
    case 'next': return { ...state, stage: state.index + 1 >= action.total ? 'complete' : 'quiz', index: Math.min(state.index + 1, action.total - 1), selected: null, result: null, explained: false }
    default: return state
  }
}

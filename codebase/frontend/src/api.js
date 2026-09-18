const API_BASE = '/api/v0';

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.warn(`API error at ${url} (${res.status}):`, errBody);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`Network/Fetch error at ${url}:`, err);
    return null;
  }
}

// 1. Health check
export async function apiGetHealth() {
  return await fetchJson(`${API_BASE}/health`);
}

// 2. Knowledge Graph (Cây tri thức)
export async function apiGetTree() {
  return await fetchJson(`${API_BASE}/graph/tree`);
}

// 3. Quiz & Chấm điểm
export async function apiGetQuiz() {
  return await fetchJson(`${API_BASE}/quiz`);
}

export async function apiGradeQuiz(picked, times) {
  return await fetchJson(`${API_BASE}/quiz/grade`, {
    method: 'POST',
    body: JSON.stringify({ picked, times }),
  });
}

// 4. AI Explain (AI #1)
export async function apiExplainSingle(payload) {
  // payload: { node_id, question, options, correct_idx, selected_idx, time_sec, flag }
  return await fetchJson(`${API_BASE}/ai/explain/single`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiExplainRound(payload) {
  // payload: { target_node_id, round_num, decision, records }
  return await fetchJson(`${API_BASE}/ai/explain/round`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 5. Chatbot phản biện chẩn đoán
export async function apiChatMessage(payload) {
  // payload: { target_node_id, weak_signals, message, history }
  return await fetchJson(`${API_BASE}/ai/chat/message`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 6. Probes & Vòng chẩn đoán
export async function apiGetProbes(targetNodeId) {
  return await fetchJson(`${API_BASE}/probes/${targetNodeId}`);
}

export async function apiEvaluateRound(payload) {
  // payload: { target_node_id, round_num, picked, times }
  return await fetchJson(`${API_BASE}/probes/evaluate-round`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 7. AI Diễn giải giả thuyết (AI #2)
export async function apiGetHypothesis(payload) {
  // payload: { target_node_id, hits, only_slow, rushed_any }
  return await fetchJson(`${API_BASE}/ai/diagnosis/hypothesis`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 8. AI Sinh lộ trình Remediation
export async function apiGeneratePlan(payload) {
  // payload: { verdict, target_node_id, trace }
  return await fetchJson(`${API_BASE}/ai/plan/generate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 9. Session (Learner state)
export async function apiCreateSession() {
  return await fetchJson(`${API_BASE}/session`, { method: 'POST' });
}

export async function apiGetSession(sessionId) {
  return await fetchJson(`${API_BASE}/session/${sessionId}`);
}

export async function apiUpdateSession(sessionId, state) {
  return await fetchJson(`${API_BASE}/session/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(state),
  });
}

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
export async function apiGetQuiz(count, doc) {
  const params = new URLSearchParams();
  if (Number.isFinite(Number(count))) params.set('count', String(Number(count)));
  if (doc === 'day-01' || doc === 'day-02') params.set('doc', doc);
  const query = params.toString() ? `?${params}` : '';
  return await fetchJson(`${API_BASE}/quiz${query}`);
}

export async function apiGradeQuiz(questionIds, picked, times) {
  return await fetchJson(`${API_BASE}/quiz/grade`, {
    method: 'POST',
    body: JSON.stringify({ question_ids: questionIds, picked, times }),
  });
}

export async function apiGetSource(code) {
  return await fetchJson(`${API_BASE}/source/${encodeURIComponent(code)}`);
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

export async function apiGenerateProbes(payload) {
  // payload: { session_id, target_node_id, round_num, retry, purpose, count }
  return await fetchJson(`${API_BASE}/probes/generate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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
export async function apiCreateSession(payload = {}) {
  // payload: { owner, session } — gửi luôn vỏ phiên để resume được ở máy khác.
  return await fetchJson(`${API_BASE}/session`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function apiGetSession(sessionId) {
  return await fetchJson(`${API_BASE}/session/${sessionId}`);
}

export async function apiListSessions(owner, limit = 20) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (owner) params.set('owner', owner);
  return await fetchJson(`${API_BASE}/session?${params}`);
}

export async function apiUpdateSession(sessionId, payload) {
  // payload: { state?, owner?, session?, completed? } — trường nào không gửi thì backend giữ nguyên.
  return await fetchJson(`${API_BASE}/session/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiGetUsage() {
  return await fetchJson(`${API_BASE}/usage`);
}

// 10. Admin — token gửi qua header, không bao giờ nằm trong URL.
// Khác fetchJson: admin cần biết LÝ DO hỏng (401 sai token, 503 chưa cấu hình).
async function adminFetch(path, token, options = {}) {
  const res = await fetch(`${API_BASE}/admin${path}`, {
    ...options,
    headers: { 'X-Admin-Token': token || '', ...options.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(body?.detail || `Backend trả lỗi HTTP ${res.status}.`);
    error.status = res.status;
    throw error;
  }
  return body;
}

export async function apiAdminLogin(token) {
  return await adminFetch('/login', token, { method: 'POST' });
}

export async function apiAdminStatus(token) {
  return await adminFetch('/status', token);
}

export async function apiAdminUploadTranscripts(token, files) {
  const form = new FormData();
  for (const file of files) form.append('files', file);
  return await adminFetch('/transcripts', token, { method: 'POST', body: form });
}

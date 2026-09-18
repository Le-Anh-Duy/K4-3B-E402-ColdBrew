import { test, expect } from '@playwright/test'

test('Backend grading receives the exact question ids shown to the learner', async ({ page }) => {
  let payload
  await page.route('**/api/v0/quiz/grade', async route => {
    payload = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        records: payload.question_ids.map((id, index) => ({ node: id, sel: payload.picked[index], correct: true, sec: payload.times[index], flag: 'ok', answer: payload.picked[index] })),
        correct_count: payload.question_ids.length,
        total_count: payload.question_ids.length,
        total_sec: payload.times.reduce((sum, value) => sum + value, 0),
      }),
    })
  })
  await page.goto('/')
  const records = await page.evaluate(async () => {
    const { learningService } = await import('/src/services/learningService.js')
    return learningService.gradeQuiz({
      source: 'backend',
      questions: [{ id: 'day1-q7' }, { id: 'day1-q2' }],
    }, [2, 0], [11, 4])
  })

  expect(payload).toEqual({ question_ids: ['day1-q7', 'day1-q2'], picked: [2, 0], times: [11, 4] })
  expect(records.map(record => record.node)).toEqual(['day1-q7', 'day1-q2'])
})

test('Citation codes are clickable in the explanation body and share one source box', async ({ page }) => {
  const nodes = {
    root: { id: 'root', label: 'Bài học từ backend', parent: null, page: 'transcript 01 · [T01-060]' },
    leaf: { id: 'leaf', label: 'Ý kiểm tra', parent: 'root', page: 'transcript 01 · [T01-060] [T01-061]' },
  }
  const quiz = Array.from({ length: 5 }, (_, index) => ({ id: `q${index + 1}`, node: 'leaf', q: `Câu backend ${index + 1}?`, options: ['A', 'B', 'C', 'D'] }))
  await page.route('**/api/v0/graph/tree', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ nodes }) }))
  await page.route('**/api/v0/quiz?count=*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(quiz) }))
  await page.route('**/api/v0/quiz/grade', async route => {
    const body = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        records: body.question_ids.map((id, index) => ({ node: 'leaf', sel: body.picked[index], correct: false, sec: 9, flag: 'wrong', answer: 0, why: 'Giảng viên nói làm đúng cái sai nguy hiểm hơn [T01-060, T01-061].', trap: null })),
        correct_count: 0, total_count: body.question_ids.length, total_sec: 45,
      }),
    })
  })
  await page.route('**/api/v0/source/T01-060', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'T01-060', file: 'transcript-01-clean.md', text: 'Nguyên văn đoạn sáu mươi.' }) }))
  await page.route('**/api/v0/source/T01-061', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'T01-061', file: 'transcript-01-clean.md', text: 'Nguyên văn đoạn sáu mươi mốt.' }) }))
  await page.route('**/api/v0/session**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session_id: 'backend-session', state: { stage: 'quiz' } }) }))

  await page.goto('/')
  await page.getByLabel('Email', { exact: true }).fill('cite@example.com')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('demo123')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.getByRole('button', { name: 'Bắt đầu Quiz' }).click()
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole('group', { name: 'Các đáp án' }).getByRole('button').nth(1).click()
    await page.getByRole('button', { name: index === 4 ? 'Nộp bài' : 'Câu tiếp →', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: 'Kết quả quiz' })).toBeVisible()
  await page.getByRole('button', { name: 'Giải thích', exact: true }).first().click()

  // Mã đoạn trong câu "Vì sao?" phải bấm được, không chỉ ở dòng ▤ bên dưới.
  const explanation = page.locator('.answer-explanation').first()
  await expect(explanation.locator('p').first().locator('.citation-ref')).toHaveCount(2)
  await explanation.locator('p').first().getByRole('button', { name: 'Xem nguồn T01-060' }).click()
  await expect(page.locator('.source-popover')).toHaveCount(1)
  await expect(page.locator('.source-popover')).toContainText('Nguyên văn đoạn sáu mươi.')

  // Bấm mã khác trong cùng khối: vẫn một ô nguồn, chỉ đổi nội dung.
  await explanation.locator('.source-citation-wrap').getByRole('button', { name: 'Xem nguồn T01-061' }).click()
  await expect(page.locator('.source-popover')).toHaveCount(1)
  await expect(page.locator('.source-popover')).toContainText('Nguyên văn đoạn sáu mươi mốt.')

  // Bấm lại chính mã đang mở thì ẩn đi.
  await explanation.locator('.source-citation-wrap').getByRole('button', { name: 'Ẩn nguồn T01-061' }).click()
  await expect(page.locator('.source-popover')).toHaveCount(0)
})

test('Probe questions are generated per round and graded against that exact set', async ({ page }) => {
  const generateCalls = []
  let gradeBody = null
  await page.route('**/api/v0/probes/generate', async route => {
    const body = route.request().postDataJSON()
    generateCalls.push(body)
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        target_node_id: body.target_node_id, target_label: 'Mục nền', slide_page: 'transcript 01 · [T01-060]',
        questions: [{ id: 0, q: `Câu vòng ${body.round_num} (${body.purpose})?`, options: ['A', 'B', 'C', 'D'] }],
        probe_key: `${body.purpose}:${body.target_node_id}:${body.round_num}:${body.retry}`,
        source: 'ai',
        usage: { task: 'generate_probes', model: 'gemini-3.5-flash-lite', prompt_tokens: 1036, completion_tokens: 1008, total_tokens: 2044, latency_ms: 4108 },
      }),
    })
  })
  await page.route('**/api/v0/probes/evaluate-round', async route => {
    gradeBody = route.request().postDataJSON()
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ decision: 'locate', next_target: null, bad_count: 0, slow_count: 0, records: [{ node: 'c1', sel: 0, correct: true, sec: 5, flag: 'ok' }], trace_entry: { t: 'x', d: 'y' }, gap: 'c1', ceiling: 'c1', scenario: 'muc_nong' }),
    })
  })

  await page.goto('/')
  const out = await page.evaluate(async () => {
    const { learningService } = await import('/src/services/learningService.js')
    const session = { id: 'sess-1', source: 'backend', remote: true, tree: { c1: { label: 'Mục nền' } } }
    const probe = await learningService.getProbes(session, 'c1', { round: 2, retry: 1, purpose: 'retest' })
    const graded = await learningService.evaluateRound({
      session, target: 'c1', round: 2, questions: probe.questions,
      picked: [0], times: [5], lastFailed: null, probeKey: probe.probeKey,
    })
    return { probeKey: probe.probeKey, source: probe.source, usage: probe.usage, text: probe.questions[0].text || probe.questions[0].q, decision: graded.decision }
  })

  // Sinh theo đúng vòng và mục đích, không dùng lại bộ cũ.
  expect(generateCalls).toEqual([{ session_id: 'sess-1', target_node_id: 'c1', round_num: 2, retry: 1, purpose: 'retest', count: 3 }])
  expect(out.text).toBe('Câu vòng 2 (retest)?')
  expect(out.source).toBe('ai')
  expect(out.usage.total_tokens).toBe(2044)
  // Chấm phải trỏ đúng bộ vừa sinh, không rơi về ngân hàng tĩnh.
  expect(gradeBody.session_id).toBe('sess-1')
  expect(gradeBody.probe_key).toBe('retest:c1:2:1')
  expect(out.decision).toBe('locate')
})

test('Every weak area is queued, not just the first one', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { learningService } = await import('/src/services/learningService.js')
    const tree = {
      m1: { label: 'Mục 1' }, m2: { label: 'Mục 2' }, m3: { label: 'Mục 3' }, m4: { label: 'Mục 4' },
      a1: { label: 'Ý 1', parent: 'm1' }, a2: { label: 'Ý 2', parent: 'm1' },
      b1: { label: 'Ý 3', parent: 'm2' }, c1: { label: 'Ý 4', parent: 'm3' }, d1: { label: 'Ý 5', parent: 'm4' },
    }
    // Sai 5 câu rải ở 4 mục khác nhau: m1 hai câu, ba mục còn lại mỗi mục một câu.
    const records = ['a1', 'a2', 'b1', 'c1', 'd1'].map(node => ({ node, correct: false, flag: 'wrong', sec: 11 }))
    const diagnosis = learningService.pickTarget(records, tree)
    return { target: diagnosis.target, queue: diagnosis.queue.map(item => [item.target, item.hits.length]) }
  })

  expect(result.target).toBe('m1')
  // Mục đang chẩn đoán đứng đầu, ba mục còn lại vẫn nằm trong hàng đợi chứ không bị bỏ.
  expect(result.queue).toEqual([['m1', 2], ['m2', 1], ['m3', 1], ['m4', 1]])
})

test('Learner can pick or drop which weak area to review', async ({ page }) => {
  const nodes = {
    root: { id: 'root', label: 'Bài học', parent: null, page: 'T01' },
    m1: { id: 'm1', label: 'Mục 1.1', parent: 'root', page: 'transcript 01 · [T01-004]' },
    m2: { id: 'm2', label: 'Mục 3.1', parent: 'root', page: 'transcript 01 · [T01-049]' },
    a1: { id: 'a1', label: 'Ý A1', parent: 'm1', page: 'T01-004' },
    a2: { id: 'a2', label: 'Ý A2', parent: 'm1', page: 'T01-006' },
    b1: { id: 'b1', label: 'Ý B1', parent: 'm2', page: 'T01-049' },
  }
  const leaves = ['a1', 'a2', 'b1', 'a1', 'b1']
  const quiz = leaves.map((node, index) => ({ id: `q${index + 1}`, node, q: `Câu ${index + 1}?`, options: ['A', 'B', 'C', 'D'] }))
  const hypothesisTargets = []
  await page.route('**/api/v0/graph/tree', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ nodes }) }))
  await page.route('**/api/v0/quiz?count=*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(quiz) }))
  await page.route('**/api/v0/quiz/grade', async route => {
    const body = route.request().postDataJSON()
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        records: body.question_ids.map((id, index) => ({ node: leaves[index], sel: 0, correct: false, sec: 12, flag: 'wrong', answer: 1, why: 'Vì vậy [T01-004].', trap: null })),
        correct_count: 0, total_count: 5, total_sec: 60,
      }),
    })
  })
  await page.route('**/api/v0/ai/diagnosis/hypothesis', async route => {
    const body = route.request().postDataJSON()
    hypothesisTargets.push(body.target_node_id)
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ target_node_id: body.target_node_id, target_label: nodes[body.target_node_id].label, slide_page: 'transcript 01 · [T01-004]', confidence: 'trung bình', confidence_explanation: 'x', hypothesis_text: `Giả thuyết cho ${body.target_node_id}`, suggested_action: 'y' }) })
  })
  await page.route('**/api/v0/session**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session_id: 'areas-session', state: { stage: 'quiz' } }) }))

  await page.goto('/')
  await page.getByLabel('Email', { exact: true }).fill('areas@example.com')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('demo123')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.getByRole('button', { name: 'Bắt đầu Quiz' }).click()
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole('group', { name: 'Các đáp án' }).getByRole('button').nth(0).click()
    await page.getByRole('button', { name: index === 4 ? 'Nộp bài' : 'Câu tiếp →', exact: true }).click()
  }

  // Nhận xét chung phải nêu CẢ HAI mục, không chỉ mục sắp chẩn đoán.
  await expect(page.locator('.areas-overview')).toContainText('2 mục')
  await expect(page.locator('.areas-overview')).toContainText('Mục 3.1')

  await page.getByRole('button', { name: 'Tìm phần nền bị hổng' }).click()
  await expect(page.getByRole('heading', { name: 'Phân tích bài làm' })).toBeVisible()
  const chips = page.locator('.area-progress li')
  await expect(chips).toHaveCount(2)
  expect(hypothesisTargets).toEqual(['m1'])

  // Bấm chip mục còn lại là chuyển thẳng sang mục đó.
  await chips.nth(1).getByRole('button', { name: /Chuyển sang: Mục 3.1/ }).click()
  await expect(page.getByText('Giả thuyết cho m2')).toBeVisible()
  expect(hypothesisTargets).toEqual(['m1', 'm2'])

  // Quay lại mục cũ KHÔNG được gọi AI lần nữa — giả thuyết đã lưu trong phiên.
  await chips.nth(0).getByRole('button', { name: /Chuyển sang: Mục 1.1/ }).click()
  await expect(page.getByText('Giả thuyết cho m1')).toBeVisible()
  expect(hypothesisTargets).toEqual(['m1', 'm2'])
  await chips.nth(1).getByRole('button', { name: /Chuyển sang: Mục 3.1/ }).click()
  await expect(page.getByText('Giả thuyết cho m2')).toBeVisible()
  expect(hypothesisTargets).toEqual(['m1', 'm2'])

  // Bỏ qua mục không muốn ôn: chip gạch ngang, và bấm lại thì khôi phục.
  await chips.nth(0).getByRole('button', { name: 'Bỏ qua mục Mục 1.1' }).click()
  await expect(chips.nth(0)).toHaveClass(/skipped/)
  await chips.nth(0).getByRole('button', { name: /Ôn lại: Mục 1.1/ }).click()
  await expect(chips.nth(0)).not.toHaveClass(/skipped/)
})

test('Admin area is token-gated and uploads transcripts to the server', async ({ page }) => {
  const TOKEN = 'token-dung'
  const status = {
    transcript_dir: '/srv/data/vlearn-pack/transcript',
    transcripts: [], transcript_segments: 0,
    tree_nodes: 38, quiz_questions: 25, probe_nodes: 7, sessions: 3,
    usage: { calls: 2, prompt_tokens: 1100, completion_tokens: 400, total_tokens: 1500,
             by_task: [{ task: 'chat', calls: 2, failed: 0, prompt_tokens: 1100, completion_tokens: 400, avg_total_tokens: 750, avg_latency_ms: 3100 }],
             first_call: '2026-09-18T17:00:00+00:00', last_call: '2026-09-18T17:05:00+00:00' },
  }
  let uploadedNames = null
  const gate = route => {
    if (route.request().headers()['x-admin-token'] !== TOKEN) {
      return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'Sai token quản trị' }) })
    }
    return null
  }
  await page.route('**/api/v0/admin/login', async route => {
    await (gate(route) || route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }))
  })
  await page.route('**/api/v0/admin/status', async route => {
    await (gate(route) || route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(status) }))
  })
  await page.route('**/api/v0/admin/transcripts', async route => {
    const rejected = gate(route)
    if (rejected) return await rejected
    uploadedNames = (route.request().postData() || '').match(/filename="([^"]+)"/g)
    status.transcripts = [{ name: 'transcript-01-clean.md', bytes: 2048, segments: 89 }]
    status.transcript_segments = 89
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ saved: [{ name: 'transcript-01-clean.md', bytes: 2048, segments: 89 }], rejected: [] }) })
  })

  await page.goto('/#admin')
  await expect(page.getByRole('heading', { name: 'Nhập token quản trị' })).toBeVisible()

  // Token sai phải bị chặn, không lọt vào trang.
  await page.getByLabel('Token').fill('token-sai')
  await page.getByRole('button', { name: 'Vào trang quản trị' }).click()
  await expect(page.getByText('Sai token quản trị')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Transcript trên server' })).toHaveCount(0)

  await page.getByLabel('Token').fill(TOKEN)
  await page.getByRole('button', { name: 'Vào trang quản trị' }).click()
  await expect(page.getByRole('heading', { name: 'Transcript trên server' })).toBeVisible()
  await expect(page.getByText('Server chưa có transcript nào')).toBeVisible()
  await expect(page.getByRole('cell', { name: 'chat' })).toBeVisible()

  await page.getByLabel('Chọn file transcript').setInputFiles({
    name: 'transcript-01-clean.md', mimeType: 'text/markdown',
    buffer: Buffer.from('**[T01-060]** Doan nguon.'),
  })
  await page.getByRole('button', { name: 'Nạp lên server' }).click()
  await expect(page.getByText('Đã nạp 1 file')).toBeVisible()
  expect(uploadedNames).toContain('filename="transcript-01-clean.md"')
  // Bảng phải tự đọc lại trạng thái sau khi nạp.
  await expect(page.getByRole('cell', { name: 'transcript-01-clean.md' })).toBeVisible()
})

test('Adaptive backend catalog and quiz are mapped into the current UI', async ({ page }) => {
  const nodes = {
    root: { id: 'root', label: 'Bài học từ backend', parent: null, page: 'T01' },
    topic: { id: 'topic', label: 'Chủ đề backend', parent: 'root', page: 'T01-001' },
    leaf: { id: 'leaf', label: 'Ý kiểm tra', parent: 'topic', page: 'T01-002' },
  }
  const quiz = Array.from({ length: 5 }, (_, index) => ({ id: `q${index + 1}`, node: 'leaf', q: `Câu backend ${index + 1}?`, options: ['A', 'B', 'C', 'D'] }))
  await page.route('**/api/v0/graph/tree', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ nodes }) }))
  await page.route('**/api/v0/quiz?count=*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(quiz) }))
  await page.route('**/api/v0/session', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session_id: 'backend-session', state: { stage: 'home' } }) }))
  await page.route('**/api/v0/session/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session_id: 'backend-session', state: { stage: 'quiz' } }) }))

  await page.goto('/')
  await page.getByLabel('Email', { exact: true }).fill('backend@example.com')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('demo123')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page.locator('.setup-fields select').first()).toHaveValue('adaptive-backend')
  await expect(page.locator('.setup-fields select').first()).toContainText('Bài học từ backend')
  await expect(page.locator('.count-options button')).toHaveCount(1)
  await page.getByRole('button', { name: 'Bắt đầu Quiz' }).click()
  await expect(page.getByRole('heading', { name: 'Câu backend 1?' })).toBeVisible()
  await expect(page.getByText('Dữ liệu có cây tri thức')).toBeVisible()
})

test('Dashboard tries the adaptive graph endpoint and falls back cleanly when offline', async ({ page }) => {
  const paths = []
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/')) paths.push(new URL(request.url()).pathname)
  })
  // This test explicitly simulates an offline backend, not a successful LLM call.
  await page.route('**/api/v0/graph/tree', route => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.goto('/')
  await page.getByLabel('Email', { exact: true }).fill('offline@example.com')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('demo123')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.getByRole('button', { name: 'Bắt đầu Quiz' }).click()
  await expect(page.getByText('Câu 1/5', { exact: true })).toBeVisible()
  await expect.poll(() => paths.length).toBeGreaterThan(0)
  expect(paths).toContain('/api/v0/graph/tree')
  // Khi offline chỉ được chạm hai đường: cây tri thức và kho phiên để khôi phục.
  expect(paths.every(path => path === '/api/v0/graph/tree' || path === '/api/v0/session')).toBe(true)
  await expect.poll(() => page.evaluate(async () => {
    const { learningService } = await import('/src/services/learningService.js')
    await learningService.getCatalog()
    return learningService.getConnectionStatus().state
  })).toBe('unavailable')
})

test('Failed LLM check remains an error and does not reveal response bodies', async ({ page }) => {
  await page.route('**/api/llm-check', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'private-upstream-diagnostic' }) }))
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { backendService } = await import('/src/services/backendService.js')
    try { await backendService.checkLlm(); return { success: true } }
    catch (error) { return { success: false, status: error.status, message: error.message } }
  })
  expect(result).toEqual({ success: false, status: 500, message: 'Backend trả lỗi HTTP 500.' })
})

test('Invalid LLM success payload is not accepted as a real reply', async ({ page }) => {
  await page.route('**/api/llm-check', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: null }) }))
  await page.goto('/')
  const rejected = await page.evaluate(async () => {
    const { backendService } = await import('/src/services/backendService.js')
    try { await backendService.checkLlm(); return false } catch { return true }
  })
  expect(rejected).toBe(true)
})

test.describe('Live backend integration (no mocked network responses)', () => {
  test.skip(process.env.RUN_LIVE_API_TESTS !== '1', 'Opt in with RUN_LIVE_API_TESTS=1; requires the real backend and its .env.')

  test('Browser → Vite proxy → backend health', async ({ page }) => {
    await page.goto('/')
    const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/health')
    const result = await page.evaluate(async () => {
      const { backendService } = await import('/src/services/backendService.js')
      const health = await backendService.health()
      return { ok: health.ok, modelIsString: typeof health.model === 'string' }
    })
    expect((await responsePromise).status()).toBe(200)
    expect(result).toEqual({ ok: true, modelIsString: true })
  })

  test('Browser → service → Vite proxy → backend → real LLM', async ({ page }) => {
    test.setTimeout(75000)
    await page.goto('/')
    const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/llm-check', { timeout: 65000 })
    // Only return validation booleans to the test runner, never provider data.
    const result = await page.evaluate(async () => {
      const { backendService } = await import('/src/services/backendService.js')
      try {
        const data = await backendService.checkLlm()
        return { success: true, nonEmptyReply: !!data.reply.trim() }
      } catch (error) { return { success: false, status: error.status || null } }
    })
    const response = await responsePromise
    expect(response.request().headers().authorization).toBeUndefined()
    expect(response.request().headers()['x-api-key']).toBeUndefined()
    expect(response.status()).toBe(200)
    expect(result).toEqual({ success: true, nonEmptyReply: true })
  })
})

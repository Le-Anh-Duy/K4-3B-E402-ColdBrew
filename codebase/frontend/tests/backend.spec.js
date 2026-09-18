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
  expect(paths.every(path => path === '/api/v0/graph/tree')).toBe(true)
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

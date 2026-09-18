import { test, expect } from '@playwright/test'

test('Dashboard checks the supported health route, never speculative business routes', async ({ page }) => {
  const paths = []
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/')) paths.push(new URL(request.url()).pathname)
  })
  // This test explicitly simulates an offline backend, not a successful LLM call.
  await page.route('**/api/health', route => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.goto('/')
  await page.getByLabel('Email', { exact: true }).fill('offline@example.com')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('demo123')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.getByRole('button', { name: 'Bắt đầu Quiz' }).click()
  await expect(page.getByText('Câu 1/5', { exact: true })).toBeVisible()
  await expect.poll(() => paths.length).toBeGreaterThan(0)
  expect(paths.every(path => path === '/api/health')).toBe(true)
  await expect.poll(() => page.evaluate(async () => {
    const { learningService } = await import('/src/services/learningService.js')
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

import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // These flows exercise the deterministic offline/demo experience.
  await page.route('**/api/v0/graph/tree', route => route.fulfill({ status: 503, body: 'Offline in demo flow test' }))
})

async function login(page, email = 'learner@example.com') {
  await page.goto('/')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Mật khẩu', { exact: true }).fill('demo123')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await page.getByRole('button', { name: 'Bắt đầu Quiz' }).click()
  await expect(page.getByText('Câu 1/5', { exact: true })).toBeVisible()
}

async function choose(page, option) {
  await page.getByRole('group', { name: 'Các đáp án' }).getByRole('button').nth(option).click()
}

async function completeQuiz(page, choices = [null, 1, 2, 1, 3]) {
  for (let index = 0; index < choices.length; index += 1) {
    if (choices[index] !== null) await choose(page, choices[index])
    await page.getByRole('button', { name: index === choices.length - 1 ? 'Nộp bài' : choices[index] === null ? 'Bỏ qua →' : 'Câu tiếp →', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: 'Kết quả quiz' })).toBeVisible()
}

async function reachProbe(page) {
  await completeQuiz(page)
  await page.getByRole('button', { name: 'Tìm phần nền bị hổng' }).click()
  await expect(page.getByRole('heading', { name: 'Phân tích bài làm' })).toBeVisible()
  await page.getByRole('button', { name: 'Hợp lý — kiểm tra câu nền' }).click()
  await expect(page.getByRole('heading', { name: 'Chẩn đoán · vòng 1' })).toBeVisible()
}

async function answerProbe(page, answers) {
  for (let index = 0; index < answers.length; index += 1) {
    await choose(page, answers[index])
    await page.getByRole('button', { name: index === answers.length - 1 ? /Kiểm tra|Nộp kiểm tra lại/ : 'Câu tiếp' }).click()
  }
}

test('quiz supports back, skip, deselect and preserves state while navigating', async ({ page }) => {
  await login(page)
  await choose(page, 0)
  await page.getByRole('button', { name: 'Câu tiếp' }).click()
  await choose(page, 2)
  await page.getByRole('button', { name: '← Câu trước' }).click()
  await expect(page.locator('.answer.selected')).toHaveCount(1)
  await page.getByRole('button', { name: 'Câu tiếp' }).click()
  await page.getByRole('navigation').getByRole('button', { name: 'Trang chủ' }).click()
  await page.getByRole('button', { name: 'Tiếp tục phiên học' }).click()
  await expect(page.getByText('Câu 2/5', { exact: true })).toBeVisible()
  await expect(page.locator('.answer.selected')).toHaveCount(1)
  await page.getByRole('button', { name: 'Bỏ chọn' }).click()
  await expect(page.locator('.answer.selected')).toHaveCount(0)
})

test('quiz draft survives a reload and ending a session requires confirmation', async ({ page }) => {
  await login(page, 'draft-reload@example.com')
  await choose(page, 0)
  await expect.poll(() => page.evaluate(() => Object.keys(localStorage)
    .filter(key => key.startsWith('coldbrew-flow:'))
    .some(key => JSON.parse(localStorage.getItem(key) || '{}').drafts?.quiz?.picked?.[0] === 0))).toBe(true)

  // Reload phải quay lại đúng màn đang làm, không đẩy về Home rồi bắt bấm tiếp tục.
  await page.reload()
  await expect(page.getByText('Câu 1/5', { exact: true })).toBeVisible()
  await expect(page.locator('.answer.selected')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Tiếp tục phiên học' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Kết thúc phiên học' }).click()
  const confirmation = page.getByRole('alertdialog', { name: 'Xác nhận kết thúc phiên học' })
  await expect(confirmation).toBeVisible()
  await confirmation.getByRole('button', { name: 'Tiếp tục học' }).click()
  await expect(confirmation).toHaveCount(0)
  await expect(page.getByText('Câu 1/5', { exact: true })).toBeVisible()
})

test('quiz is graded only after the whole batch is submitted', async ({ page }) => {
  await login(page)
  await choose(page, 1)
  await expect(page.getByText('Chưa chính xác', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Câu tiếp' }).click()
  await expect(page.getByText('Câu 2/5', { exact: true })).toBeVisible()
  await completeQuiz(page, [null, 1, 2, 1])
  await expect(page.locator('.review-answer')).toHaveCount(5)
})

test('result offers separate explanation and diagnosis paths', async ({ page }) => {
  await login(page)
  await completeQuiz(page)
  await page.getByRole('button', { name: 'Giải thích đáp án' }).click()
  await expect(page.getByRole('heading', { name: 'Giải thích đáp án' })).toBeVisible()
  await expect(page.locator('.answer-explanation')).toHaveCount(5)
  await page.getByRole('button', { name: 'Tìm phần nền bị hổng' }).click()
  await expect(page.getByRole('heading', { name: 'Phân tích bài làm' })).toBeVisible()
  await expect(page.getByText('GIẢ THUYẾT')).toBeVisible()
})

test('each quiz result has an individual explanation toggle', async ({ page }) => {
  await login(page)
  await completeQuiz(page)
  await expect(page.getByRole('button', { name: 'Giải thích', exact: true })).toHaveCount(5)
  await expect(page.locator('.source-citation')).toHaveCount(0)
  await page.getByRole('button', { name: 'Giải thích', exact: true }).first().click()
  await expect(page.locator('.answer-explanation')).toHaveCount(1)
  // Dữ liệu demo cố tình không có mã đoạn, nên không được dựng nút trích dẫn giả.
  await expect(page.locator('.source-citation-wrap')).toContainText('Nội dung demo')
  await expect(page.locator('.citation-ref')).toHaveCount(0)
  await expect(page.locator('.source-popover')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ẩn giải thích' })).toHaveAttribute('aria-expanded', 'true')
  const firstCard = page.locator('.review-answer').first()
  const togglePosition = await firstCard.evaluate(card => {
    const button = card.querySelector('.explanation-toggle')
    const cardBox = card.getBoundingClientRect()
    const buttonBox = button.getBoundingClientRect()
    return { isLast: card.lastElementChild === button, rightGap: cardBox.right - buttonBox.right }
  })
  expect(togglePosition.isLast).toBe(true)
  expect(togglePosition.rightGap).toBeLessThanOrEqual(22)
  await page.getByRole('button', { name: 'Ẩn giải thích' }).click()
  await expect(page.locator('.answer-explanation')).toHaveCount(0)

  await page.getByRole('button', { name: 'Giải thích', exact: true }).first().click()
  await page.getByRole('button', { name: 'Giải thích đáp án' }).click()
  await page.getByRole('button', { name: 'Về kết quả' }).click()
  await expect(page.locator('.answer-explanation')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Giải thích', exact: true })).toHaveCount(5)
})

test('learner confirms the hypothesis before entering a probe round', async ({ page }) => {
  await login(page)
  await reachProbe(page)
  await expect(page.getByText('Câu 1/3', { exact: true })).toBeVisible()
  await expect(page.getByText('Cây tri thức', { exact: true })).toBeVisible()
  await expect(page.getByText(/Dấu vết quyết định/)).toBeVisible()
})

test('diagnosis chat calls Gemini through the backend even for a demo session', async ({ page }) => {
  let requestBody
  await page.route('**/api/v0/ai/chat/message', async route => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reply: 'Phản hồi từ Gemini',
        grounded_node: requestBody.target_label,
        slide_page: requestBody.source_page || '(chưa có mã đoạn nguồn)',
        suggested_actions: [],
        usage: { task: 'chat', model: 'gemini-3.5-flash-lite', prompt_tokens: 593, completion_tokens: 225, total_tokens: 818, latency_ms: 3702 },
      }),
    })
  })

  await login(page, 'gemini-chat@example.com')
  await completeQuiz(page)
  await page.getByRole('button', { name: 'Tìm phần nền bị hổng' }).click()
  await page.getByRole('button', { name: /Chưa thuyết phục/ }).click()
  await page.getByPlaceholder('Hỏi về chẩn đoán này…').fill('Vì sao lại chẩn đoán như vậy?')
  await page.getByRole('button', { name: 'Gửi' }).click()

  await expect(page.getByText('Phản hồi từ Gemini')).toBeVisible()
  // Token của chính lời gọi đó phải hiện ngay dưới câu trả lời để đối chiếu khi báo cáo.
  await expect(page.locator('.bub.ai .usage-chip')).toHaveText('⇅ 593↑ 225↓ token · 3.7s')
  expect(requestBody.message).toBe('Vì sao lại chẩn đoán như vậy?')
  expect(requestBody.target_label).toBeTruthy()
  expect(requestBody.weak_signals.length).toBeGreaterThan(0)
})

test('passing a probe produces a sourced remediation plan', async ({ page }) => {
  await login(page)
  await reachProbe(page)
  await answerProbe(page, [0, 0, 1])
  await expect(page.getByRole('heading', { name: 'Kết quả vòng 1' })).toBeVisible()
  await page.getByRole('button', { name: 'Xem lộ trình ôn' }).click()
  await expect(page.getByRole('heading', { name: 'Lộ trình ôn tập' })).toBeVisible()
  await expect(page.locator('.knowledge-card')).toHaveCount(3)
  await expect(page.getByText('Vì sao bạn nhận lộ trình này?')).toBeVisible()
})

test('failing the foundation probe recommends reviewing the whole lesson', async ({ page }) => {
  await login(page)
  await reachProbe(page)
  await answerProbe(page, [1, 1, 0])
  await page.getByRole('button', { name: 'Xem tóm tắt cả bài' }).click()
  await expect(page.getByText('Nên xem lại bài này từ đầu')).toBeVisible()
})

test('retest requires every answer to be correct before mastery is cleared', async ({ page }) => {
  await login(page)
  await reachProbe(page)
  await answerProbe(page, [0, 0, 1])
  await page.getByRole('button', { name: 'Xem lộ trình ôn' }).click()
  await page.getByRole('button', { name: 'Mình ôn xong rồi — kiểm tra lại' }).click()
  await expect(page.getByRole('heading', { name: 'Kiểm tra lại sau khi ôn' })).toBeVisible()
  await answerProbe(page, [0, 0, 1])
  await expect(page.getByText(/Đã nắm:/)).toBeVisible()
  await page.getByRole('button', { name: '5 sao' }).click()
  await page.getByRole('button', { name: 'Vừa đủ, dùng được' }).click()
  await page.getByRole('button', { name: 'Gửi đánh giá' }).click()
  await expect(page.getByText('Bạn đã chấm lời tư vấn 5/5')).toBeVisible()
})

test('completed adaptive session appears in progress history', async ({ page }) => {
  await login(page)
  await completeQuiz(page, [0, 1, 2, 1, 3])
  await page.getByRole('button', { name: 'Hoàn thành phiên' }).click()
  await expect(page.getByRole('heading', { name: 'Phiên học đã hoàn thành' })).toBeVisible()
  await page.getByRole('button', { name: 'Về trang chủ' }).click()
  await page.getByRole('navigation').getByRole('button', { name: 'Tiến độ' }).click()
  await expect(page.getByText('5/5 câu đã trả lời đúng')).toBeVisible()
})

test('registration validation and mobile layout remain intact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
  await page.getByLabel('Họ và tên').fill('Minh Anh')
  await page.getByLabel('Email', { exact: true }).fill('minh@example.com')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('demo123')
  await page.getByLabel('Xác nhận mật khẩu').fill('wrong123')
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()
  await expect(page.getByRole('alert')).toHaveText('Mật khẩu xác nhận chưa khớp.')
  await page.getByLabel('Xác nhận mật khẩu').fill('demo123')
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Bắt đầu Quiz' }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('desktop visual shell remains the current ColdBrew UI', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Chào mừng bạn trở lại' })).toBeVisible()
  await page.getByLabel('Email', { exact: true }).fill('visual@example.com')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('demo123')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page.getByRole('heading', { name: 'Bạn muốn ôn tập nội dung nào?' })).toBeVisible()
  await expect(page.locator('.app-topbar > .demo-strip')).toBeVisible()
  await expect(page.locator('.app-header .brand-mark svg')).toBeVisible()
  expect(await page.locator('.app-topbar').evaluate(element => element.firstElementChild.classList.contains('demo-strip'))).toBe(true)
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  await expect(page.locator('.app-topbar')).toHaveCSS('position', 'sticky')
  expect(await page.locator('.app-topbar').evaluate(element => element.getBoundingClientRect().top)).toBe(0)
})

test('quiz wheel exposes 5–20 and updates the selected question count', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email', { exact: true }).fill('wheel@example.com')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('demo123')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  await expect(page.locator('.quiz-wheel-number')).toHaveCount(16)
  const spin = page.locator('.count-options button')
  await spin.click()
  await expect(spin).toBeDisabled()
  await expect(spin).toBeEnabled({ timeout: 4000 })

  const result = Number(await page.locator('.quiz-wheel-hub strong').textContent())
  expect(result).toBeGreaterThanOrEqual(5)
  expect(result).toBeLessThanOrEqual(20)
  await expect(page.getByRole('button', { name: new RegExp(`Bắt đầu Quiz · ${result} câu`) })).toBeVisible()
})

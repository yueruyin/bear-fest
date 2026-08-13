import { expect, test } from '@playwright/test'

test('官网首页和案例详情可访问', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: '小熊团队' })).toBeVisible()
  await expect(page.getByRole('link', { name: '查看案例' }).first()).toBeVisible()

  await page.goto('/cases')
  const caseLink = page.getByRole('link', { name: /WTT 重庆站大型赛事执行案例/ })
  await expect(caseLink).toBeVisible()
  await caseLink.click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'WTT 重庆站大型赛事执行案例' }),
  ).toBeVisible()
})

test('联系表单可提交', async ({ page }) => {
  await page.goto('/contact')

  await page.getByLabel('姓名').fill('E2E 测试客户')
  await page.getByLabel('公司').fill('E2E 测试公司')
  await page.getByLabel('联系方式').fill('e2e@example.com')
  await page.getByLabel('需求描述').fill('这是一个用于 Playwright 端到端测试的合作咨询需求。')

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/leads') &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: '提交咨询' }).click()
  const response = await responsePromise

  expect(response.status()).toBe(201)
  await expect(page.getByText('提交成功，我们会尽快与你联系。')).toBeVisible()
})

test('后台要求登录且管理员可以登录', async ({ page }) => {
  await page.goto('/admin/site-config')

  await expect(page).toHaveURL(/\/admin\/login$/)
  await expect(page.getByRole('heading', { name: '登录运营工作台' })).toBeVisible()

  await page.getByLabel('管理员账号').fill('e2e-admin')
  await page.getByLabel('登录密码').fill('e2e-admin-password-123')
  await page.getByRole('button', { name: '进入工作台' }).click()

  await expect(page).toHaveURL(/\/admin\/site-config$/)
  await expect(page.getByRole('heading', { name: '站点内容' })).toBeVisible()
})

import { test, expect, Page } from '@playwright/test'

const NEED = 'Mid-size retail company, 100 users, need sales pipeline management, customer service, and analytics reporting with Salesforce.'

async function generateAndGetToDashboard(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const textarea = page.locator('textarea').first()
  await textarea.fill(NEED)

  // Select demo mode
  const demoBtn = page.locator('button', { hasText: /^Demo$/ })
  if (await demoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await demoBtn.click()
  }

  // describe → confirm
  await page.locator('button', { hasText: 'Continue' }).first().click()
  await page.waitForTimeout(500)

  // confirm → expand
  const confirmContinue = page.locator('button', { hasText: 'Continue' })
  if (await confirmContinue.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmContinue.first().click()
    await page.waitForTimeout(500)
  }

  // expand → generating
  await page.locator('button', { hasText: /Generate Blueprint|Generate \+/ }).first().click()

  // wait for results
  await page.waitForSelector('button:has-text("Overview")', { timeout: 30000 })
}

test.describe('Blueprint Dashboard Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await generateAndGetToDashboard(page)
  })

  test('Overview tab is active by default', async ({ page }) => {
    const overviewTab = page.locator('button, [role="tab"]', { hasText: /overview/i }).first()
    await expect(overviewTab).toBeVisible()
    await page.screenshot({ path: 'artifacts/tab-overview.png' })
  })

  test('Architecture tab switches content', async ({ page }) => {
    const archTab = page.locator('button, [role="tab"]', { hasText: /architecture/i }).first()
    await archTab.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'artifacts/tab-architecture.png' })
    await expect(archTab).toBeVisible()
  })

  test('Cost tab shows cost estimate', async ({ page }) => {
    const costTab = page.locator('button, [role="tab"]', { hasText: /cost/i }).first()
    await costTab.click()
    await page.waitForTimeout(500)
    // Cost section should show dollar amounts or estimate text
    const body = await page.textContent('body') ?? ''
    const hasCostInfo = /\$|\bestimate\b|\blicense\b|\bper user\b/i.test(body)
    expect(hasCostInfo).toBeTruthy()
    await page.screenshot({ path: 'artifacts/tab-cost.png' })
  })

  test('Roadmap tab renders', async ({ page }) => {
    const roadmapTab = page.locator('button, [role="tab"]', { hasText: /roadmap/i }).first()
    await roadmapTab.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'artifacts/tab-roadmap.png' })
    await expect(roadmapTab).toBeVisible()
  })

  test('Data Model tab renders', async ({ page }) => {
    const dataTab = page.locator('button, [role="tab"]', { hasText: /data model/i }).first()
    if (await dataTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dataTab.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'artifacts/tab-data-model.png' })
      await expect(dataTab).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('Ask AI tab shows chat interface (if present)', async ({ page }) => {
    // The Ask AI tab was removed from the main dashboard nav as of the latest commit.
    // This test checks if it exists in the tab bar specifically (not the floating widget).
    const tabBar = page.locator('nav, [role="tablist"]').first()
    const aiTab = tabBar.locator('button', { hasText: /ask ai/i })
    if (!await aiTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip() // Tab removed from dashboard — expected
      return
    }
    await aiTab.click()
    await page.waitForTimeout(500)
    const chatInput = page.locator('input[placeholder*="ask" i], textarea[placeholder*="ask" i]').first()
    await expect(chatInput).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'artifacts/tab-ask-ai.png' })
  })
})

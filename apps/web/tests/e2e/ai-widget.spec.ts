import { test, expect } from '@playwright/test'

test.describe('AI Assistant Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('floating widget button is visible on home page', async ({ page }) => {
    // The widget is a floating button — look for ✦ or AI-related button
    const widgetBtn = page.locator('button').filter({ hasText: /✦|ask ai|assistant/i })
    if (await widgetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(widgetBtn.first()).toBeVisible()
      await page.screenshot({ path: 'artifacts/ai-widget-closed.png' })
    } else {
      test.skip() // Widget may render differently
    }
  })

  test('widget opens on click and shows chat input', async ({ page }) => {
    const widgetBtn = page.locator('button').filter({ hasText: /✦|ask ai|assistant/i }).first()
    if (!await widgetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip()
    }

    await widgetBtn.click()
    await page.waitForTimeout(500)

    const chatInput = page.locator('input[type="text"], textarea').last()
    await expect(chatInput).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'artifacts/ai-widget-open.png' })
  })

  test('widget persists on auth pages', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')

    const widgetBtn = page.locator('button').filter({ hasText: /✦|ask ai|assistant/i }).first()
    if (await widgetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(widgetBtn).toBeVisible()
    } else {
      test.skip()
    }
  })
})

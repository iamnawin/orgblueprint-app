import { test, expect, Page } from '@playwright/test'

const SAMPLE_NEED = 'We are a 75-person manufacturing company. We need Salesforce to manage leads, opportunities, and a custom pricing model with at least 3 external integrations including ERP and ecommerce.'

/**
 * Navigate through the full demo-mode wizard:
 * describe → confirm → expand → generating → results (BlueprintDashboard)
 */
async function runDemoWizard(page: Page, needText: string) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // 1. Type need text
  const textarea = page.locator('textarea').first()
  await textarea.fill(needText)

  // 2. Select Demo mode explicitly
  const demoBtn = page.locator('button', { hasText: /^Demo$/ })
  if (await demoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await demoBtn.click()
  }

  // 3. Click "Continue" (describe → confirm)
  await page.locator('button', { hasText: 'Continue' }).first().click()
  await page.waitForTimeout(500)

  // 4. Click "Continue" (confirm → expand)
  const confirmContinue = page.locator('button', { hasText: 'Continue' })
  if (await confirmContinue.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmContinue.first().click()
    await page.waitForTimeout(500)
  }

  // 5. Click "Generate Blueprint" (expand → generating)
  const generateBtn = page.locator('button', { hasText: /Generate Blueprint|Generate \+/ })
  await generateBtn.first().click()

  // 6. Wait for results (BlueprintDashboard with Overview tab)
  await page.waitForSelector('button:has-text("Overview")', { timeout: 30000 })
}

test.describe('Blueprint Generation — Demo Mode', () => {
  test('full wizard: describe → confirm → generating → dashboard', async ({ page }) => {
    await runDemoWizard(page, SAMPLE_NEED)
    await page.screenshot({ path: 'artifacts/demo-dashboard.png' })

    const overviewTab = page.locator('button', { hasText: /overview/i }).first()
    await expect(overviewTab).toBeVisible()
  })

  test('dashboard shows product recommendations', async ({ page }) => {
    await runDemoWizard(page, SAMPLE_NEED)

    // Dashboard should show some product names
    const body = await page.textContent('body')
    const hasSalesforceProduct = /sales cloud|service cloud|experience cloud|data cloud|platform/i.test(body || '')
    expect(hasSalesforceProduct).toBeTruthy()
    await page.screenshot({ path: 'artifacts/demo-products.png', fullPage: true })
  })
})

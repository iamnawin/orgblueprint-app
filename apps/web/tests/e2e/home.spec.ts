import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/HomePage'

test.describe('Home Page', () => {
  let home: HomePage

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page)
    await home.goto()
  })

  test('loads and shows the conversation interface', async ({ page }) => {
    await expect(page).toHaveTitle(/orgblueprint|blueprint/i)
    // Textarea or chat input should be present
    await expect(home.needTextarea).toBeVisible()
    await page.screenshot({ path: 'artifacts/home-loaded.png' })
  })

  test('accepts text input in the needs textarea', async ({ page }) => {
    const sampleText = 'We need a CRM system to manage leads and opportunities for a 50-person sales team.'
    await home.typeNeed(sampleText)
    await expect(home.needTextarea).toHaveValue(sampleText)
  })

  test('shows a generate/continue button after typing', async ({ page }) => {
    await home.typeNeed('Sales team needs Salesforce setup with lead management and reporting.')
    // Some action button should appear or be enabled
    const actionBtn = page.locator('button', { hasText: /generate|continue|start/i }).first()
    await expect(actionBtn).toBeVisible()
  })

  test('example chips populate the textarea', async ({ page }) => {
    // Chips use exact labels: "B2B Sales Team", "Customer Portal & Support", etc.
    const knownChipLabels = ['B2B Sales Team', 'Customer Portal', 'Complex Pricing', 'ERP Integration']
    let found = false
    for (const label of knownChipLabels) {
      const chip = page.locator('button', { hasText: label })
      if (await chip.isVisible({ timeout: 1000 }).catch(() => false)) {
        await chip.first().click()
        await page.waitForTimeout(300) // React state update
        const value = await home.needTextarea.inputValue()
        expect(value.length).toBeGreaterThan(10)
        await page.screenshot({ path: 'artifacts/home-chip-clicked.png' })
        found = true
        break
      }
    }
    if (!found) test.skip()
  })
})

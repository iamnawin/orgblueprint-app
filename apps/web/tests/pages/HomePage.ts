import { Page, Locator } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly needTextarea: Locator
  readonly demoModeButton: Locator
  readonly aiModeButton: Locator
  readonly generateButton: Locator
  readonly continueButton: Locator
  readonly confirmButton: Locator

  constructor(page: Page) {
    this.page = page
    // Main textarea for describing needs
    this.needTextarea = page.locator('textarea').first()
    // Mode toggle buttons
    this.demoModeButton = page.locator('button', { hasText: /demo/i }).first()
    this.aiModeButton = page.locator('button', { hasText: /ai enhanced/i }).first()
    // Action buttons
    this.generateButton = page.locator('button', { hasText: /generate/i }).first()
    this.continueButton = page.locator('button', { hasText: /continue/i }).first()
    this.confirmButton = page.locator('button', { hasText: /confirm/i }).first()
  }

  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async typeNeed(text: string) {
    await this.needTextarea.click()
    await this.needTextarea.fill(text)
  }

  async clickFirstExampleChip() {
    const chips = this.page.locator('button').filter({ hasText: /sales|service|marketing/i })
    const count = await chips.count()
    if (count > 0) {
      await chips.first().click()
    }
  }

  async proceedWithDemoMode(needText?: string) {
    if (needText) {
      await this.typeNeed(needText)
    }
    // Try to click demo mode if visible
    const demoBtn = this.page.locator('button', { hasText: /demo/i })
    if (await demoBtn.isVisible().catch(() => false)) {
      await demoBtn.first().click()
    }
    // Click generate/continue
    const actionBtn = this.page.locator('button', { hasText: /generate|continue/i }).first()
    await actionBtn.click()
  }
}

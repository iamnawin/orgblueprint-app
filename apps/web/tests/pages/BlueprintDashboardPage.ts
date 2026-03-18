import { Page, Locator } from '@playwright/test'

export type TabId = 'overview' | 'architecture' | 'data-model' | 'technical' | 'cost' | 'roadmap' | 'ask-ai'

export class BlueprintDashboardPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(slug: string) {
    await this.page.goto(`/blueprint/${slug}`)
    await this.page.waitForLoadState('networkidle')
  }

  tab(name: string): Locator {
    return this.page.locator('button, [role="tab"]', { hasText: new RegExp(name, 'i') }).first()
  }

  async clickTab(name: string) {
    await this.tab(name).click()
    await this.page.waitForTimeout(300) // small wait for render
  }

  async isDashboardVisible(): Promise<boolean> {
    // Dashboard is visible when at least one tab is shown
    const tabs = ['Overview', 'Architecture', 'Cost', 'Roadmap']
    for (const t of tabs) {
      const el = this.page.locator('button, [role="tab"]', { hasText: t })
      if (await el.isVisible().catch(() => false)) return true
    }
    return false
  }

  async downloadPdf() {
    const downloadPromise = this.page.waitForEvent('download')
    const pdfBtn = this.page.locator('button', { hasText: /pdf|download/i }).first()
    await pdfBtn.click()
    return downloadPromise
  }
}

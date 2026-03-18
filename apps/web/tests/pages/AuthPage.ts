import { Page, Locator } from '@playwright/test'

export class AuthPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly nameInput: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[type="email"], input[name="email"]')
    this.passwordInput = page.locator('input[type="password"], input[name="password"]')
    this.nameInput = page.locator('input[name="name"], input[placeholder*="name" i]')
    this.submitButton = page.locator('button[type="submit"]')
  }

  async gotoSignIn() {
    await this.page.goto('/auth/signin')
    await this.page.waitForLoadState('networkidle')
  }

  async gotoSignUp() {
    await this.page.goto('/auth/signup')
    await this.page.waitForLoadState('networkidle')
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async signUp(name: string, email: string, password: string) {
    if (await this.nameInput.isVisible().catch(() => false)) {
      await this.nameInput.fill(name)
    }
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
    await this.page.waitForLoadState('networkidle')
  }
}

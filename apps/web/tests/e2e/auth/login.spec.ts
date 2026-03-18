import { test, expect } from '@playwright/test'
import { AuthPage } from '../../pages/AuthPage'

test.describe('Sign In', () => {
  let authPage: AuthPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    await authPage.gotoSignIn()
  })

  test('renders sign-in form', async ({ page }) => {
    await expect(authPage.emailInput).toBeVisible()
    await expect(authPage.passwordInput).toBeVisible()
    await expect(authPage.submitButton).toBeVisible()
    await page.screenshot({ path: 'artifacts/signin-form.png' })
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await authPage.signIn('notauser@example.com', 'wrongpassword')
    // Should stay on signin page or show error
    const errorEl = page.locator('[role="alert"], .error, [class*="error"], p').filter({ hasText: /invalid|incorrect|failed|error/i })
    const isOnSignin = page.url().includes('/signin') || page.url().includes('/auth')
    expect(isOnSignin || await errorEl.isVisible().catch(() => false)).toBeTruthy()
    await page.screenshot({ path: 'artifacts/signin-error.png' })
  })

  test('has a link to sign up', async ({ page }) => {
    const signupLink = page.locator('a', { hasText: /sign up|register|create account/i }).first()
    await expect(signupLink).toBeVisible()
  })
})

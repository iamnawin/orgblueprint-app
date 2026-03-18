import { test as base } from '@playwright/test'
import { AuthPage } from '../pages/AuthPage'

// Test credentials — only used against local SQLite dev DB
export const TEST_USER = {
  name: 'E2E Test User',
  email: 'e2e@test.local',
  password: 'testpassword123',
}

type AuthFixtures = {
  authPage: AuthPage
}

export const test = base.extend<AuthFixtures>({
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page))
  },
})

export { expect } from '@playwright/test'

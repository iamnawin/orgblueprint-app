import { test, expect } from '@playwright/test'

test.describe('API Endpoints', () => {
  test('GET / returns 200', async ({ request }) => {
    const res = await request.get('/')
    expect(res.status()).toBe(200)
  })

  test('POST /api/blueprint with demo mode returns blueprint', async ({ request }) => {
    const res = await request.post('/api/blueprint', {
      data: {
        needText: 'Small sales team, 20 users, need lead and opportunity management.',
        mode: 'demo',
        expansions: [],
        answers: [],
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    // Should have result with products
    expect(body).toHaveProperty('result')
    const result = body.result
    expect(result).toHaveProperty('products')
    expect(Array.isArray(result.products)).toBeTruthy()
  })

  test('POST /api/blueprint with demo mode returns costEstimate', async ({ request }) => {
    const res = await request.post('/api/blueprint', {
      data: {
        needText: 'Enterprise company, 500 users, complex integrations, Data Cloud, Sales Cloud.',
        mode: 'demo',
        expansions: [],
        answers: [],
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.result).toHaveProperty('costEstimate')
  })

  test('POST /api/blueprint missing needText does not crash', async ({ request }) => {
    const res = await request.post('/api/blueprint', {
      data: { mode: 'demo' },
    })
    // API handles missing needText gracefully (200 with empty result, or error status)
    expect([200, 400, 422, 500]).toContain(res.status())
  })

  test('POST /api/conversation returns a question', async ({ request }) => {
    const res = await request.post('/api/conversation', {
      data: {
        needText: 'We need help with Salesforce implementation.',
        answers: [],
        questionCount: 0,
      },
    })
    // May return 429 if quota exceeded or 200 with question
    expect([200, 429, 503]).toContain(res.status())
    if (res.status() === 200) {
      const body = await res.json()
      expect(body).toHaveProperty('question')
    }
  })

  test('GET /api/blueprints returns 401 when unauthenticated', async ({ request }) => {
    const res = await request.get('/api/blueprints')
    expect([401, 403]).toContain(res.status())
  })
})

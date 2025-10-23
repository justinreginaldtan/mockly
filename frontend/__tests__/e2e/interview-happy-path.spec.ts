import { test, expect } from '@playwright/test'

/**
 * E2E Test: Interview Happy Path
 * Tests the complete interview flow from setup to results
 *
 * PREREQUISITE: Run `npm install --save-dev @playwright/test --legacy-peer-deps`
 * PREREQUISITE: Run `npx playwright install` to install browsers
 */

test.describe('Interview Happy Path', () => {
  test('should complete full interview flow from setup to results', async ({ page, context }) => {
    // Grant microphone permission
    await context.grantPermissions(['microphone'])

    // 1. Navigate to setup page
    await page.goto('/setup')
    await expect(page).toHaveURL('/setup')

    // 2. Configure interview
    // Select persona (click first persona card)
    await page.locator('[data-testid="persona-card"]').first().click()

    // Select focus areas (click 2-3 focus area chips)
    const focusAreas = page.locator('[data-testid="focus-area-chip"]')
    await focusAreas.nth(0).click() // Leadership
    await focusAreas.nth(1).click() // Adaptability

    // Accept default technical weight, voice style, duration

    // 3. Start interview
    await page.locator('button:has-text("Start mock interview")').click()
    await expect(page).toHaveURL('/mock')

    // 4. Verify session storage
    const setupData = await page.evaluate(() => sessionStorage.getItem('mi:setup'))
    expect(setupData).toBeTruthy()

    const planData = await page.evaluate(() => sessionStorage.getItem('mi:plan'))
    expect(planData).toBeTruthy()

    // 5. Join interview room
    await page.locator('button:has-text("Join interview")').click()

    // Wait for interview to start
    await page.waitForTimeout(2000)

    // 6. Mock Web Speech API for answer recording
    await page.evaluate(() => {
      // @ts-ignore
      window.SpeechRecognition = class MockSpeechRecognition {
        continuous = true
        interimResults = true
        lang = 'en-US'

        start() {
          setTimeout(() => {
            if (this.onstart) this.onstart(new Event('start'))
            if (this.onspeechstart) this.onspeechstart(new Event('speechstart'))

            // Simulate interim results
            setTimeout(() => {
              if (this.onresult) {
                const event = {
                  results: [[{ transcript: 'This is my test answer to the first question', isFinal: false }]],
                  resultIndex: 0
                }
                this.onresult(event)
              }
            }, 500)

            // Simulate final result
            setTimeout(() => {
              if (this.onresult) {
                const event = {
                  results: [[{ transcript: 'This is my test answer to the first question', isFinal: true }]],
                  resultIndex: 0
                }
                this.onresult(event)
              }
              if (this.onspeechend) this.onspeechend(new Event('speechend'))
              if (this.onend) this.onend(new Event('end'))
            }, 2000)
          }, 100)
        }

        stop() {
          if (this.onend) this.onend(new Event('end'))
        }

        abort() {}
      }
    })

    // 7. Unmute to start recording
    const muteButton = page.locator('button[aria-label*="mute"], button:has-text("Unmute")')
    if (await muteButton.isVisible()) {
      await muteButton.click()
    }

    // Wait for transcript to appear
    await page.waitForTimeout(3000)

    // 8. Verify response saved to sessionStorage
    const responses = await page.evaluate(() => sessionStorage.getItem('mi:responses'))
    expect(responses).toBeTruthy()

    // 9. Click Continue to advance
    await page.locator('button:has-text("Continue"), button:has-text("Ready for next question")').click()
    await page.waitForTimeout(1000)

    // 10. Answer one more question (same process)
    if (await muteButton.isVisible()) {
      await muteButton.click()
    }
    await page.waitForTimeout(3000)

    // 11. Wrap up interview
    await page.locator('button:has-text("Wrap up interview")').click()
    await expect(page).toHaveURL('/results')

    // 12. Verify results page loads evaluation
    await page.waitForSelector('text=/score/i', { timeout: 30000 })

    // Check that evaluation data is displayed
    await expect(page.locator('text=/strengths/i')).toBeVisible()
    await expect(page.locator('text=/areas/i')).toBeVisible()

    // 13. Verify export and restart buttons exist
    await expect(page.locator('button:has-text("Export Results")')).toBeVisible()
    await expect(page.locator('button:has-text("Start New Interview")')).toBeVisible()
  })
})

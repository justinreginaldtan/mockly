import { test, expect } from '@playwright/test'

/**
 * E2E Test: Microphone Permission Denied Fallback
 * Tests the interview flow when microphone access is denied
 *
 * PREREQUISITE: Run `npm install --save-dev @playwright/test --legacy-peer-deps`
 * PREREQUISITE: Run `npx playwright install` to install browsers
 */

test.describe('Interview Mic Permission Denied', () => {
  test('should allow text input when microphone permission is denied', async ({ page, context }) => {
    // Do NOT grant microphone permission

    // 1. Navigate to setup and configure interview
    await page.goto('/setup')

    // Select persona and focus areas
    await page.locator('[data-testid="persona-card"]').first().click()
    const focusAreas = page.locator('[data-testid="focus-area-chip"]')
    await focusAreas.nth(0).click()
    await focusAreas.nth(1).click()

    // 2. Start interview
    await page.locator('button:has-text("Start mock interview")').click()
    await expect(page).toHaveURL('/mock')

    // 3. Join interview room
    await page.locator('button:has-text("Join interview")').click()
    await page.waitForTimeout(2000)

    // 4. Mock Web Speech API to simulate permission denied error
    await page.evaluate(() => {
      // @ts-ignore
      window.SpeechRecognition = class MockSpeechRecognition {
        continuous = true
        interimResults = true
        lang = 'en-US'

        start() {
          setTimeout(() => {
            if (this.onerror) {
              const event = {
                error: 'not-allowed',
                message: 'Microphone permission denied'
              }
              this.onerror(event)
            }
          }, 100)
        }

        stop() {}
        abort() {}
      }
    })

    // 5. Try to unmute/start recording to trigger error
    const muteButton = page.locator('button[aria-label*="mute"], button:has-text("Unmute")')
    if (await muteButton.isVisible()) {
      await muteButton.click()
    }

    // Wait for error state to trigger
    await page.waitForTimeout(1000)

    // 6. Verify error banner is visible
    await expect(page.locator('text=/Microphone unavailable/i')).toBeVisible()
    await expect(page.locator('text=/type your answer/i')).toBeVisible()

    // 7. Verify textarea fallback is visible
    const textarea = page.locator('textarea[placeholder*="Type your answer"]')
    await expect(textarea).toBeVisible()

    // 8. Type answer in textarea
    const testAnswer = 'This is my typed answer for testing purposes when microphone is unavailable.'
    await textarea.fill(testAnswer)

    // 9. Verify character count updates
    await expect(page.locator(`text=/${testAnswer.length} characters/i`)).toBeVisible()

    // 10. Verify Submit Answer button is enabled after 10+ characters
    const submitButton = page.locator('button:has-text("Submit Answer")')
    await expect(submitButton).toBeEnabled()

    // 11. Submit text answer
    await submitButton.click()

    // 12. Verify answer saved to sessionStorage
    const responses = await page.evaluate(() => {
      const data = sessionStorage.getItem('mi:responses')
      return data ? JSON.parse(data) : null
    })
    expect(responses).toBeTruthy()
    expect(responses.responses).toBeTruthy()

    // Find the first response and verify it's marked as text input
    const firstResponse = Object.values(responses.responses)[0] as any
    expect(firstResponse.transcript).toContain(testAnswer)
    expect(firstResponse.isTextInput).toBe(true)

    // 13. Verify Continue button is enabled after submitting answer
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Ready for next question")')
    await expect(continueButton).toBeEnabled()

    // 14. Continue to next question
    await continueButton.click()
    await page.waitForTimeout(1000)

    // 15. Answer another question via text
    await textarea.fill('This is my second typed answer.')
    await submitButton.click()
    await page.waitForTimeout(500)

    // 16. Wrap up interview
    await page.locator('button:has-text("Wrap up interview")').click()
    await expect(page).toHaveURL('/results')

    // 17. Verify results page processes text answers correctly
    await page.waitForSelector('text=/score/i', { timeout: 30000 })
    await expect(page.locator('text=/strengths/i')).toBeVisible()

    // No errors related to missing voice data should appear
    await expect(page.locator('text=/error/i')).not.toBeVisible()
  })
})

import { test, expect } from '@playwright/test'

test.describe('play page', () => {
  test('renders the game board and controls', async ({ page }) => {
    await page.goto('/play')

    await expect(
      page.getByRole('heading', { name: '2048 Badge Game' })
    ).toBeVisible()

    const board = page.getByTestId('game-board')
    await expect(board).toBeVisible()

    // Game spawns 2 tiles on init; wait for them (client-side render)
    const tiles = page.getByTestId('tile')
    await expect(tiles).toHaveCount(2, { timeout: 10000 })

    const soundToggle = page.getByRole('button', { name: /Sound/ })
    await expect(soundToggle).toBeVisible()
    const initialLabel = (await soundToggle.textContent()) ?? ''
    await soundToggle.click()

    if (initialLabel.includes('On')) {
      await expect(soundToggle).toHaveText(/Sound Off/)
    } else {
      await expect(soundToggle).toHaveText(/Sound On/)
    }
  })
})

import { test, expect, type Page } from '@playwright/test'

const navigateFromHeader = async (page: Page, name: string) => {
  const menuButton = page.getByRole('button', { name: 'Toggle navigation menu' })
  if (await menuButton.isVisible()) {
    await menuButton.click()
    await page.locator('#mobile-navigation').getByRole('link', { name }).click()
    return
  }
  await page.getByRole('link', { name }).click()
}

test.describe('leaderboard', () => {
  test('leaderboard page shows heading and top scores section', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
    await expect(page.getByText('Top scores by wallet')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Top scores' })).toBeVisible()
  })

  test('without wallet shows connect message in Your rank', async ({ page }) => {
    await page.goto('/leaderboard')
    // Leaderboard shows connect CTA in intro text when wallet not connected
    await expect(page.getByText(/Connect your wallet and play/)).toBeVisible()
  })

  test('leaderboard is reachable from nav', async ({ page }) => {
    await page.goto('/')
    await navigateFromHeader(page, 'Leaderboard')
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
  })

  test('shows leaderboard content after load (empty or table)', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(
      page.getByText('No entries yet').or(page.getByRole('columnheader', { name: 'Rank' }))
    ).toBeVisible({ timeout: 10000 })
  })
})

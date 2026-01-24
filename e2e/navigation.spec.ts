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

test.describe('navigation', () => {
  test('can reach core pages from home', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: 'Welcome to badge2048' })
    ).toBeVisible()

    await page.getByRole('link', { name: 'Start Playing' }).click()
    await expect(
      page.getByRole('heading', { name: '2048 Badge Game' })
    ).toBeVisible()

    await navigateFromHeader(page, 'Badges')
    await expect(page.getByRole('heading', { name: 'Badges' })).toBeVisible()

    await navigateFromHeader(page, 'Claim')
    await expect(
      page.getByRole('heading', { name: 'Claim Badges' })
    ).toBeVisible()
  })
})

import { test, type Page } from '@playwright/test'
import { boot } from './helpers'

/**
 * Viewport sweep: captures Home + Edit-mode Add-to-dock at every mandated
 * breakpoint and reports horizontal overflow + console errors. Used for the V2
 * before/after visual record. Output dir via BASELINE_OUT (default
 * .shots/v2-baseline). Not an assertion suite.
 */
const OUT = process.env.BASELINE_OUT ?? '.shots/v2-baseline'
const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 834, height: 1112 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 393, height: 852 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 360, height: 800 },
  { width: 320, height: 700 },
]

async function shoot(page: Page, name: string) {
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

test('viewport sweep (baseline / after record)', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  await boot(page)

  for (const vp of VIEWPORTS) {
    await page.setViewportSize(vp)
    await page.waitForTimeout(120)
    const tag = `${vp.width}x${vp.height}`
    // 1) Home default
    await shoot(page, `${tag}-home`)
    // 2) Horizontal-overflow probe
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    // 3) Edit Mode + Add-to-dock popover (the reported bug surface)
    await page.getByRole('button', { name: 'Edit Home', exact: true }).click().catch(() => {})
    await page.waitForTimeout(80)
    await page.getByRole('button', { name: 'Add to dock', exact: true }).click().catch(() => {})
    await page.waitForTimeout(250)
    await shoot(page, `${tag}-edit-dockadd`)
    // close the popover / exit edit to keep states clean between sizes
    await page.getByRole('button', { name: 'Done editing Home', exact: true }).click().catch(() => {})
    await page.waitForTimeout(80)
    console.log(`BASELINE ${tag} overflowX=${overflow}`)
  }
  console.log(`BASELINE errors=${JSON.stringify(errors)}`)
})

"""Capture actual local application evidence; synthetic data and no production access."""
import asyncio, sys
from playwright.async_api import async_playwright
assert sys.argv[1] in ('before', 'after', 'revision')
base = sys.argv[2] if len(sys.argv) > 2 else 'http://127.0.0.1:3101'
assert base.startswith(('http://127.0.0.1:', 'http://localhost:'))
async def main():
 async with async_playwright() as p:
  browser = await p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
  views = [('income-desktop',1440,1100,'income'),('income-mobile',390,1100,'income'),('navigation-mobile',375,650,'income'),('results-mobile',390,1100,'results'),('family-mobile',390,1000,'family')]
  for name,width,height,path in views:
   page = await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   await page.goto(base+'/planning/'+path)
   await page.wait_for_timeout(400)
   await page.screenshot(path=f'docs/ux-b1/evidence/{sys.argv[1]}-{name}.png')
   await page.close()
  page = await browser.new_page(viewport={'width':1440,'height':1100})
  await page.goto(base+'/planning/income')
  await page.get_by_label('เงินเดือนต่อเดือน',exact=True).fill('100000')
  await page.get_by_label('โบนัสทั้งปี',exact=True).fill('50000')
  await page.get_by_label('โบนัสทั้งปี',exact=True).blur()
  await page.locator('.tp-income-summary').screenshot(path=f'docs/ux-b1/evidence/{sys.argv[1]}-summary.png')
  await browser.close()
asyncio.run(main())

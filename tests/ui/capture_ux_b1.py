import asyncio,sys,json
from playwright.async_api import async_playwright
assert sys.argv[1] in ('before', 'after')
base = sys.argv[2] if len(sys.argv) > 2 else 'http://127.0.0.1:3101'
assert base.startswith(('http://127.0.0.1:', 'http://localhost:'))
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  for name,width,height,path in [('income-desktop',1440,1100,'income'),('income-mobile',390,1100,'income'),('navigation-mobile',375,650,'income'),('results-mobile',390,1100,'results')]:
   page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   await page.goto(base+'/planning/'+path); await page.wait_for_timeout(500)
   await page.screenshot(path=f'docs/ux-b1/evidence/{sys.argv[1]}-{name}.png')
   await page.close()
  await browser.close()
asyncio.run(main())

"""Isolated Chromium regression checks; no production requests or user browser profile.
Requires external QA tooling: Python Playwright + Chromium (no app dependency).
Run after npm run build / npm run start -- --port 3101:
  python3 tests/ui/ux-b1.py http://127.0.0.1:3101
"""
import asyncio, json, sys, re
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:3101'
assert BASE.startswith(('http://127.0.0.1:', 'http://localhost:')), 'Local synthetic QA only'
ROUTES = ['income', 'family', 'deductions', 'planner', 'results']
KEY = 'thai-tax-planner-v0.1'
async def run():
 async with async_playwright() as p:
  browser = await p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
  context = await browser.new_context(viewport={'width': 390, 'height': 1000})
  page = await context.new_page()
  errors = []
  page.on('pageerror', lambda e: errors.append(str(e)))
  matrix = []
  for width in [375, 390, 430, 768, 1440]:
   await page.set_viewport_size({'width': width, 'height': 1000})
   for route in ROUTES:
    await page.goto(f'{BASE}/planning/{route}')
    await page.get_by_role('button', name='เริ่มคำนวณใหม่', exact=True).wait_for(state='visible')
    await page.wait_for_timeout(100)
    geometry = await page.evaluate('''() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
     steps: [...document.querySelectorAll('.tp-step-link')].map(e => {const r=e.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right}}),
     current: document.querySelectorAll('[aria-current="step"]').length })''')
    assert geometry['scroll'] <= width, (route, width, geometry)
    assert geometry['current'] == 1
    assert len(geometry['steps']) == 5
    assert all(s['width'] >= 44 and s['height'] >= 44 and s['left'] >= 0 and s['right'] <= width for s in geometry['steps']), (route, width, geometry)
    matrix.append({'route': route, 'width': width, 'overflow': False, 'touch_targets': 'pass'})
  await page.goto(f'{BASE}/planning/income')
  salary = page.get_by_label('เงินเดือนต่อเดือน', exact=True)
  await salary.fill('100000')
  await salary.blur()
  assert await salary.input_value() == '100,000'
  await page.reload()
  await salary.wait_for()
  await page.wait_for_function("document.querySelector('.tp-income input').value === '100,000'")
  snapshot = await page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
  assert snapshot['income']['monthlySalary'] == 100000 and snapshot['schemaVersion'] == 14
  await page.get_by_role('link', name='ถัดไป →', exact=True).click()
  await page.wait_for_url('**/planning/family')
  await page.locator('nav a[href="/planning/results"]').click()
  await page.wait_for_url('**/planning/results')
  result = await page.locator('main').inner_text()
  assert '125,000' in result, 'Existing salary fixture tax changed'
  await page.locator('nav a[href="/planning/income"]').click()
  await salary.wait_for()
  # Keyboard reaches a form field with a visible focus ring.
  await salary.focus()
  focus = await salary.evaluate('(e) => ({outline: getComputedStyle(e).outlineStyle, color: getComputedStyle(e).borderColor})')
  assert focus['outline'] != 'none' or focus['color'] == 'rgb(8, 126, 139)'
  # Cancel Reset must preserve the synthetic financial value.
  page.once('dialog', lambda dialog: dialog.dismiss())
  await page.get_by_role('button', name='เริ่มคำนวณใหม่', exact=True).click()
  assert await salary.input_value() == '100,000'
  # Confirm Reset in this isolated context only; verify stale-tab guard too.
  other = await context.new_page()
  await other.goto(f'{BASE}/planning/income')
  await other.wait_for_function("document.querySelector('.tp-income input').value === '100,000'")
  page.once('dialog', lambda dialog: dialog.accept())
  await page.get_by_role('button', name='เริ่มคำนวณใหม่', exact=True).click()
  await page.wait_for_function("document.querySelector('.tp-income input').value === ''")
  await other.wait_for_function("document.querySelector('.tp-income input').value === ''")
  await other.get_by_label('โบนัสทั้งปี', exact=True).fill('5000')
  await other.get_by_label('โบนัสทั้งปี', exact=True).blur()
  data = await other.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
  assert data['income']['monthlySalary'] == 0 and data['income']['annualBonus'] == 5000
  # Expand every foreign-income type and create one synthetic entry per add action.
  await page.set_viewport_size({'width': 375, 'height': 1000})
  await page.get_by_role('button', name='มี', exact=True).first.click()
  selectors = page.get_by_role('button', name=re.compile(r'^40\('))
  for selector in await selectors.all():
   await selector.click()
  await page.get_by_role('button', name='มี', exact=True).last.click()
  add_buttons = page.get_by_role('button', name=re.compile(r'^\+ เพิ่ม'))
  for button in await add_buttons.all():
   await button.click()
  await page.wait_for_timeout(100)
  # The full long form must remain usable at all requested widths.
  for width in [375, 390, 430, 768, 1440]:
   await page.set_viewport_size({'width': width, 'height': 1000})
   assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), ('expanded income overflow', width)
  missing_labels = await page.locator('input,select,textarea').evaluate_all("els => els.filter(e => !(e.labels?.length || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby'))).map(e => e.outerHTML.slice(0,100))")
  assert not missing_labels, missing_labels
  ids = await page.locator('input[id],select[id]').evaluate_all('els => els.map(e=>e.id)')
  assert len(ids) == len(set(ids)), 'Duplicate control IDs'
  await page.get_by_label('ประเทศที่มาของรายได้', exact=True).first.fill('United States')
  await page.get_by_label('รายได้จากต่างประเทศทั้งก้อน', exact=True).first.fill('12000')
  await page.get_by_label('ยอดที่นำเข้าไทยในปี 2569', exact=True).first.fill('12000')
  await page.get_by_text('ข้อมูลรายได้ต่างประเทศยังไม่ครบ', exact=True).wait_for(state='visible')
  await page.get_by_label('ภาษีที่จ่ายในต่างประเทศ', exact=True).first.fill('1000')
  await page.get_by_role('button', name='ใช่', exact=True).first.click()
  await page.get_by_role('button', name='มีสิทธิ FTC', exact=True).first.click()
  await page.get_by_label('ภาษีต่างประเทศที่ใช้พิจารณา FTC หลังตรวจ DTA', exact=True).first.fill('1000')
  assert await page.get_by_label('ภาษีต่างประเทศที่ใช้พิจารณา FTC หลังตรวจ DTA', exact=True).first.input_value() == '1000'
  assert await page.get_by_role('button', name='มีสิทธิ FTC', exact=True).first.get_attribute('aria-pressed') == 'true'
  assert not errors, errors
  print(json.dumps({'matrix': matrix, 'salary_format_autosave_resume': 'pass', 'navigation_and_tax_fixture': '125,000 pass', 'focus': 'pass', 'cancel_confirm_reset_and_two_tabs': 'pass', 'expanded_foreign_domestic_labels_warning_ftc': 'pass', 'page_errors': errors}, ensure_ascii=False, indent=2))
  await browser.close()
asyncio.run(run())

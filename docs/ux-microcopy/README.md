# TaxPlanner UX Wording & Microcopy — Director Review

## Branch isolation
- From verified `main` `13ad01ab765567967a610872ad63518c31bfe9ff`, independent branch `feature/ux-microcopy-polish-20261103`.
- PR #7 (B2) is unmerged and intentionally **not** included.
- Changes only in copy and progressive disclosure; no engine/rules, state,
  financial calculations, persistence, auth/access, dependencies or Vercel settings.
- Official Production https://taxplannervid.vercel.app remains unchanged.

## Complete wording change table
Each row lists the precise old/revised content (some TSX strings use linebreaks).
The legal expanded text is not changed; the default explanation is shorter.

| Page | Original | Revised |
|---|---|---|
| Income | รายได้จากงานประจำอื่น ๆ ตลอดปี | รายได้อื่นจากนายจ้างทั้งปี |
| Family | มีผู้มีเงินได้คนอื่นใช้สิทธิบุพการีคนนี้แล้วหรือไม่? | มีคนอื่นใช้สิทธิลดหย่อนบิดา/มารดาท่านนี้แล้วหรือไม่? |
| Family | อัตราภาษีขั้นสูงสุด (Marginal Rate) | อัตราภาษีขั้นสูงสุด |
| Deductions | จำนวนที่ใช้สิทธิได้บางรายการอาจยังเปลี่ยนแปลงได้ | ยอดลดหย่อนอาจเปลี่ยนเมื่อกรอกข้อมูลครบ |
| Planner | ประหยัดภาษีสุทธิเพิ่ม | ภาษีที่คาดว่าจะประหยัดเพิ่ม |
| Results | อัตราภาษีขั้นสูงสุด (Marginal Rate) | อัตราภาษีขั้นสูงสุด |
| Results | ภาษีที่ต้องชำระหลังเครดิต | ภาษีที่ต้องจ่ายเพิ่ม |
| Family | ตอนนี้ระบบจะจัดสรรสิทธิให้อัตโนมัติ โดยใช้กับเงินได้ 40(2) ก่อน แล้วจึงใช้กับเงินได้ 40(1) หากต้องการกำหนดเอง ให้กรอกจำนวนในแต่ละประเภทเงินได้ด้านล่าง | ระบบจัดสรรสิทธิให้อัตโนมัติ โดยใช้กับเงินได้ 40(2) ก่อน แล้วจึงใช้กับเงินได้ 40(1) คุณปรับเองได้ด้านล่าง |
| Family | ยังไม่สามารถคำนวณภาษีได้ครบถ้วน เนื่องจากมีข้อมูลบางรายการที่ยังไม่สมบูรณ์ กรุณาตรวจสอบคำเตือนด้านล่าง | ข้อมูลยังไม่ครบ กรุณาตรวจสอบรายการด้านล่างเพื่อคำนวณภาษี |
| Deductions | ตอนนี้ให้กรอกจำนวนที่จ่ายจริงก่อน บางรายการอาจใช้ลดหย่อนภาษีได้ไม่เต็มจำนวน เนื่องจากมีเพดานเฉพาะและเพดานร่วม | กรอกยอดที่จ่ายจริง ระบบจะคำนวณสิทธิลดหย่อนตามเพดานให้ |
| Planner | ยังไม่สามารถเปรียบเทียบผลการวางแผนได้ เนื่องจากข้อมูลสำหรับคำนวณภาษีบางรายการยังไม่สมบูรณ์ กรุณาตรวจสอบคำเตือนด้านบนก่อน | ยังเปรียบเทียบผลไม่ได้ กรุณากรอกข้อมูลที่ขาดตามคำเตือนด้านบน |
| Results | กรุณาตรวจสอบข้อมูลที่ยังไม่ครบถ้วนก่อน ระบบจึงจะแสดงผลเปรียบเทียบภาษีและผลประหยัดภาษี | กรอกข้อมูลให้ครบเพื่อดูผลภาษีก่อนและหลังวางแผน |
| Deductions — Solar Rooftop | กรอกเฉพาะค่าซื้อและติดตั้งที่เข้าเงื่อนไข (ที่อยู่อาศัย / MEA-PEA / e-Tax Invoice / 1 ครั้ง 1 ระบบ / สูงสุด 200,000 บาท) | กรอกค่าซื้อและติดตั้งที่เข้าเงื่อนไขและมี e-Tax Invoice · **ดูเงื่อนไข** สำหรับข้อกำหนดฉบับเต็ม |
| Deductions — งานทัศนศิลป์ | กรอกเฉพาะยอดซื้อผลงานที่เข้าเงื่อนไข พร้อมประเภทงานและเพดาน 100,000 บาท | กรอกยอดซื้องานทัศนศิลป์ที่เข้าเงื่อนไข · **ดูเงื่อนไข** สำหรับประเภทผลงานและเพดาน |
| Deductions — กองทัพอากาศ | สำหรับเงินบริจาคผ่านบัญชีเฉพาะเพื่อโครงการสร้างพระสถูปเจดีย์ ใช้สิทธิ 1 เท่า และเพดานร่วม 10% | กรอกเฉพาะยอดผ่านบัญชีโครงการสร้างพระสถูปเจดีย์ของกองทัพอากาศ · **ดูเงื่อนไข** สำหรับสิทธิและเพดาน (ยังคง พ.ร.ฎ. 804 ในป้ายรายการ) |
| Deductions — ประกันสุขภาพบิดา/มารดา | เพิ่มแยกตามกรมธรรม์และบิดา/มารดา เพื่อให้ระบบตรวจสิทธิและกรณีร่วมจ่ายได้ถูกต้อง | เพิ่มกรมธรรม์แยกตามบิดา/มารดา · **ดูเงื่อนไข** สำหรับเหตุผลและการตรวจกรณีร่วมจ่าย |

### Full preserved legal disclosure content
Solar Rooftop: กรอกเฉพาะค่าซื้อและติดตั้งที่เข้าเงื่อนไข ระบบต้องติดตั้งบนที่อยู่อาศัย เชื่อมต่อโครงข่าย MEA/PEA สำเร็จ และมี e-Tax Invoice ใช้สิทธิได้ 1 ครั้ง 1 ระบบ สูงสุด 200,000 บาท

Art purchase: กรอกเฉพาะยอดซื้อผลงานที่เข้าเงื่อนไข เช่น จิตรกรรม ประติมากรรม ภาพพิมพ์ ภาพถ่าย หรือสื่อผสม ใช้สิทธิได้ตามจริงสูงสุด 100,000 บาท

Air Force donation / Royal Decree 804: สำหรับเงินที่บริจาคผ่านบัญชีเฉพาะของกองทัพอากาศเพื่อโครงการสร้างพระสถูปเจดีย์ ใช้สิทธิ 1 เท่า และใช้เพดาน 10% ร่วมกับเงินบริจาคทั่วไป

Parent health insurance: เพิ่มแยกตามกรมธรรม์และบิดา / มารดา เพื่อให้ระบบตรวจสิทธิและกรณีร่วมจ่ายได้ถูกต้อง

All three deduction-field descriptions and parent health guidance have
shortened visible text but preserve these original sentences under the
native `<details><summary>ดูเงื่อนไข</summary>` control.
The Air Force field label `เงินบริจาคให้กองทัพอากาศตาม พ.ร.ฎ. 804`
remains unchanged, as do all conditional alerts and user validation.

## Deliberately unchanged / semantic limitations

| Page | Preserved wording | Reason |
|---|---|---|
| Income | ภาษีหัก ณ ที่จ่ายจากเงินได้ 40(1) | Explicit Director exception; actual withholding input |
| Family | เงินได้พึงประเมินทั้งปี (two instances) | Explicit Director exception; tax assessment terminology |
| Results | เครดิตภาษีหัก ณ ที่จ่าย | Engine totals **creditable** tax withheld, not necessarily all withheld tax; ภาษีที่ถูกหักไว้แล้ว could imply the latter |
| Family / Results | เงินได้สุทธิ | Taxable income term, unchanged technical meaning |
| Income / Family | เงินได้ 40(1), เงินได้ 40(2) | Preserve statutory income categories |
| Deductions | MEA/PEA, e-Tax Invoice, solar 200,000 baht, 1 time / 1 system | Legal conditions fully retained in details |
| Deductions | Royal Decree 804, air-force donation 1x and shared 10% ceiling | Full conditions retained in details |

### Results label semantic check
The source calculation `taxPayable = max(0, taxAfterForeignTaxCredit -
domesticTaxCredits)` subtracts foreign tax credit and creditable domestic
withholding/dividend credits. The distinct `taxRefund` represents overpayment.
Thus the revised label `ภาษีที่ต้องจ่ายเพิ่ม` denotes additional net amount
payable, **not** pre-credit liability. No math was changed.

## Dependency / conflict with PR #7
This new branch is based **only on main**. PR #7 also edits
`src/app/planning/family/page.tsx` and
`src/app/planning/deductions/page.tsx`; integration when B2 is approved
may require a dedicated manual merge. In particular B2 moved the
incomplete Family message below its Indigo hero; this branch edits the
original `main` message. Reapply/resolve the wording there once B2 is merged;
do not cherry-pick or silently overwrite unapproved B2 changes.

## QA
- Source contract tests preserve exact exceptions, warnings, navigation, legal
  text, native keyboard-focusable disclosure and payable bindings.
- Required: full GitHub Actions Vitest/ESLint/TypeScript/Build on exact commit.
- Manual Director UAT: 390px mobile + 375/430/768/1440px overflow; Tab and
  Space/Enter through each `ดูเงื่อนไข`; inspect Solar, Art, Air Force and
  Parent Health; verify all five steps and no missing warnings.
- Verify existing synthetic tax fixture, autosave, reset cancel/confirm and
  two-tab behavior; no real data in screenshots.
- Browser tests/screenshots **NOT EXECUTED in connector-only environment**
  until independently captured. CI/source checks do not equal visual QA.
- **Stop: Draft PR only**, no merge, no auto-merge, no manual Production
  deployment, no legacy project changes.

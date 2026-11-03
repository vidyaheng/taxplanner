# B1 QA record — 3 November 2026 (Asia/Bangkok)

## Environment and flow

Actual local Next.js production builds; isolated headless Chromium using the installed
Python Playwright tool and `/usr/bin/chromium`. No user browser profile, production data,
production requests or network financial-data submission was used. App flow under test:
Income inputs → existing context/localStorage → reload/resume → five-step navigation →
existing Results calculation. No new API or database boundary exists in B1.

Physical iPhone Safari and Android Chrome were **not tested**. WebKit is not installed in
this environment, so the mobile evidence is Chromium viewport testing, not Safari testing.
No assistive-technology or complete WCAG audit is claimed.

## Browser outcomes

| Check | Observed result |
| --- | --- |
| Income/Family/Deductions/Planner/Results × 375/390/430/768/1440px | All 25 cases pass: no horizontal page overflow, exactly one current step, all five step links within viewport and >=44px targets |
| Fully expanded Income at all five widths | Pass: all 10 foreign income selectors opened and each add action exercised; domestic other-income fields opened; no page overflow |
| Labels and IDs in expanded form | All visible input/select controls associated with labels or aria-label; unique control IDs |
| Salary input formatting | 100000 displays as 100,000 with original parser/formatter |
| Autosave / reload | monthlySalary=100000 restored; original storage key and schema 14 retained |
| Navigation / financial fixture | Income Next → Family → Results → Income succeeds; unchanged salary fixture produces tax 125,000 |
| Keyboard focus | Focus outline/border visible on Income input |
| Reset cancel | Synthetic salary remains 100,000 |
| Reset confirm / second tab | Both isolated tabs return to empty salary; subsequent bonus edit does not restore stale salary |
| Foreign-income warning / FTC | Positive remittance with unknown tax residence shows existing incomplete-information warning; residence selection reveals the existing DTA/FTC controls; FTC entry works and selected state is exposed |
| Browser runtime errors | No pageerror events in the checked flow |

The warning fixture follows existing rules: zero remittance is not the incomplete-residence
case; positive remittance is entered before asserting the warning. No rule was changed to
make the UI test pass. The script uses only synthetic financial data in a disposable local
context and refuses remote URLs.

Machine-readable results: [qa-results.json](qa-results.json).
Reproduction: `npm run build`, then `npm run start -- --port 3101`, then
`python3 tests/ui/ux-b1.py http://127.0.0.1:3101` in a QA environment with Python Playwright
and Chromium. Screenshots can be recaptured with
`python3 tests/ui/capture_ux_b1.py after http://127.0.0.1:3101`.

## Code and build gates

- Full existing Vitest suite plus six navigation cases: **337/337 pass, 17 files**.
- ESLint, TypeScript no-emit, production build and git diff checks: pass.
- Build retains the existing routes and generates 11 static pages.
- The existing Vite future-native-config-loader warning remains; no tooling migration.
- Source AST comparison against base confirms existing input props, handlers and non-render
  statements unchanged in the four touched form/Reset modules (excluding new useId hooks).
- Financial engine/rules/tests, store, P1a foundation, access/event rules, live routes,
  Family/Deductions/Planner/Results page sources and dependency manifests have no diff.
- No new dependency or audit remediation is included. The previously documented Moderate
  development-tooling residual is not claimed to be eliminated by this UI work.

## Limitations / Director acceptance

Representative smoke tests are not exhaustive coverage of every financial combination,
every long label/value, screen-reader/browser version or layout-shift metric. Conditional
branches are additionally protected by the unchanged business tests and source comparison.
Screenshots were visually inspected for the primary Income views and existing Results shell.
Results/Family/Deductions/Planner content has intentionally not been redesigned; the existing
Results table remains dense at phone widths and is a later design workstream.

Request Director visual and functional review of the Draft PR and subsequent physical-device
acceptance. No merge, auto-merge, manual deployment, project configuration or legacy retirement
is authorized in this PR. Recommendation: **READY FOR REVIEW**, with device/assistive-technology
acceptance explicitly outstanding before any release decision.

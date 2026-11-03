import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('./ResetPlannerButton', () => ({ default: () => createElement('button', null, 'เริ่มคำนวณใหม่') }));
import PlanningStepper from './PlanningStepper';

const paths = ['income', 'family', 'deductions', 'planner', 'results'];
describe('planning navigation semantics', () => {
  it.each([1, 2, 3, 4, 5] as const)('preserves every destination and identifies active step %i', currentStep => {
    const html = renderToStaticMarkup(createElement(PlanningStepper, { currentStep }));
    expect(html).toContain('<nav aria-label="ขั้นตอนการวางแผนภาษี">');
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    const activeLink = html.match(/<a\b[^>]*aria-current="step"[^>]*>/)?.[0];
    expect(activeLink).toContain(`href="/planning/${paths[currentStep - 1]}"`);
    for (const path of paths) expect(html).toContain(`href="/planning/${path}"`);
    expect(html.match(/<li /g)).toHaveLength(5);
    expect(html.match(/data-state="previous"/g) ?? []).toHaveLength(currentStep - 1);
  });
  it('retains Reset without treating earlier steps as financially validated', () => {
    const html = renderToStaticMarkup(createElement(PlanningStepper, { currentStep: 5 }));
    expect(html).toContain('เริ่มคำนวณใหม่');
    expect(html).toContain('ขั้นตอนก่อนหน้า');
    expect(html).not.toContain('ข้อมูลครบ');
  });
});

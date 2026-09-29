#!/usr/bin/env node
// Runtime audit of a running app page against the Ensign Career Coach design system.
// Checks what static CSS cannot: computed sizes after the cascade, overflow, focus visibility.
//
//   node scripts/ecc_audit_runtime.mjs <url> [--field "#chat-input"] [--setup state.js] [--json out.json]
//   --setup: a JS file evaluated in the page after load (open a tab, modal or sample data) so hidden states get audited too
//
// Needs the `playwright` npm package (npm i -D playwright). Uses installed Google Chrome
// (channel "chrome") so no browser download is needed. Exit 1 on any FAIL.
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const url = args[0];
const opt = (k) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : null; };
if (!url) { console.error('usage: ecc_audit_runtime.mjs <url> [--field <selector>] [--json out.json]'); process.exit(2); }
const setupJs = opt('--setup') ? readFileSync(opt('--setup'), 'utf8') : '';
const fieldSel = opt('--field') || 'textarea, input[type="text"], input[type="email"], input[type="search"]';
const WIDTHS = [320, 375, 768, 1440, 1920];

// ECC_BROWSER_PATH points at a Chromium binary (cloud sessions); otherwise use installed Chrome
const browser = await chromium.launch(process.env.ECC_BROWSER_PATH ? { executablePath: process.env.ECC_BROWSER_PATH } : { channel: process.env.ECC_BROWSER_CHANNEL || 'chrome' });
const page = await browser.newPage();
const results = [];
let fail = false;

for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  if (setupJs) { await page.evaluate(setupJs); await page.waitForTimeout(300); }
  const r = await page.evaluate(({ fieldSel }) => {
    const out = { findings: [] };
    const add = (severity, code, msg) => out.findings.push({ severity, code, msg });
    if (document.documentElement.scrollWidth > innerWidth + 1) add('FAIL', 'horizontal-scroll', `page is ${document.documentElement.scrollWidth}px wide`);
    const visible = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    // smallest rendered text
    let small = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode; if (!n.textContent.trim()) continue;
      const el = n.parentElement; if (!el || !visible(el) || el.closest('[aria-hidden="true"], .sr-only, .visually-hidden')) continue;
      const px = parseFloat(getComputedStyle(el).fontSize);
      if (px < 17) small.push(`${px}px "${n.textContent.trim().slice(0, 30)}"`);
    }
    if (small.length) add('FAIL', 'text-below-floor', `${small.length} text runs under 17px, e.g. ${small.slice(0, 3).join(' | ')}`);
    // touch targets
    const tiny = [...document.querySelectorAll('button, a[href], [role="button"], input:not([type="hidden"]), select, textarea, summary')]
      .filter(visible).filter((el) => { const b = el.getBoundingClientRect(); return b.height < 43.5 || b.width < 43.5; })
      .filter((el) => !(el.tagName === 'A' && getComputedStyle(el).display === 'inline'));
    if (tiny.length) add('FAIL', 'touch-target', `${tiny.length} controls under 44x44, e.g. ${tiny.slice(0, 3).map((e) => (e.id ? '#' + e.id : e.tagName.toLowerCase()) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)).join(' | ')}`);
    // clipped off the right edge
    const clipped = [...document.querySelectorAll('body *')].filter(visible).filter((el) => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed');
    if (clipped.length) add('FAIL', 'clipped-right', `${clipped.length} elements past the right edge, e.g. ${clipped.slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ')[0]).join(' | ')}`);
    // text fields
    const fields = [...document.querySelectorAll(fieldSel)].filter(visible);
    out.fields = fields.map((f) => { const s = getComputedStyle(f); const b = f.getBoundingClientRect();
      return { id: f.id || f.name || f.tagName.toLowerCase(), bg: s.backgroundColor, border: `${s.borderTopWidth} ${s.borderTopColor}`, font: s.fontSize, w: Math.round(b.width), h: Math.round(b.height) }; });
    for (const f of out.fields) {
      if (f.bg !== 'rgb(241, 245, 249)') add('FAIL', 'field-fill', `${f.id} background ${f.bg}, expected input-fill #f1f5f9`);
      if (f.border !== '2px rgb(100, 116, 139)') add('FAIL', 'field-border', `${f.id} border ${f.border}, expected 2px #64748b`);
      if (f.h < 44) add('FAIL', 'field-height', `${f.id} is ${f.h}px tall`);
      if (f.w < 200 && innerWidth >= 320) add('WARN', 'field-narrow', `${f.id} is only ${f.w}px wide`);
    }
    return out;
  }, { fieldSel });

  // keyboard focus on the first field
  // first VISIBLE field (a hidden field cannot take focus, which would report a false focus-ring FAIL)
  let firstField = null;
  for (const h of await page.$$(fieldSel)) { if (await h.isVisible()) { firstField = h; break; } }
  if (firstField) {
    await page.keyboard.press('Tab');
    await firstField.focus();
    const ring = await firstField.evaluate((e) => { const s = getComputedStyle(e); return { style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor, fv: e.matches(':focus-visible') }; });
    if (ring.style === 'none' || parseFloat(ring.width) < 2) r.findings.push({ severity: 'FAIL', code: 'focus-ring', msg: `field focus outline ${ring.style} ${ring.width}` });
    else if (ring.color !== 'rgb(0, 102, 69)') r.findings.push({ severity: 'WARN', code: 'focus-color', msg: `field focus ring ${ring.color}, expected brand #006645` });
  }
  if (r.findings.some((f) => f.severity === 'FAIL')) fail = true;
  results.push({ width: w, ...r });
  const c = (s) => r.findings.filter((f) => f.severity === s).length;
  console.log(`@${w}px: ${c('FAIL')} FAIL ${c('WARN')} WARN`);
  for (const f of r.findings) console.log(`    ${f.severity.padEnd(4)} ${f.code.padEnd(18)} ${f.msg}`);
}

await browser.close();
const out = opt('--json');
if (out) writeFileSync(out, JSON.stringify({ url, results }, null, 1));
process.exit(fail ? 1 : 0);

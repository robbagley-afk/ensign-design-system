#!/usr/bin/env node
// Runtime audit of a running app page against the Ensign Career Coach design system.
// Checks what static CSS cannot: computed sizes after the cascade, overflow, focus visibility.
//
//   node scripts/ecc_audit_runtime.mjs <url> [--field "#chat-input"] [--setup state.js] [--json out.json]
//   --setup: a JS file evaluated in the page after load (open a tab, modal or sample data) so hidden states get audited too
//   --v2: also enforce ECC v2 (skill v3.1.0): body 20px, primary buttons and fields 56px, nav and chip targets 48px,
//         text AA 4.5:1 as FAIL, control boundary and focus ring 3:1. Hover and current-state checks are WARN.
//
// Needs the `playwright` npm package (npm i -D playwright). Uses installed Google Chrome
// (channel "chrome") so no browser download is needed. Exit 1 on any FAIL.
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const url = args[0];
const opt = (k) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : null; };
if (!url) { console.error('usage: ecc_audit_runtime.mjs <url> [--field <selector>] [--setup state.js] [--v2] [--json out.json]'); process.exit(2); }
const setupJs = opt('--setup') ? readFileSync(opt('--setup'), 'utf8') : '';
const fieldSel = opt('--field') || 'textarea, input[type="text"], input[type="email"], input[type="search"]';
const WIDTHS = [320, 375, 768, 1440, 1920];
const V2 = args.includes('--v2');

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
    // Content inside a horizontal scroller (the spec's single-row suggestion rail) is reachable by scrolling,
    // so it is not clipped as long as the scroller itself ends inside the viewport. overflow: hidden still counts as clipped.
    const inScroller = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { if (/auto|scroll/.test(getComputedStyle(a).overflowX)) return a.getBoundingClientRect().right <= innerWidth + 1; } return false; };
    const clipped = [...document.querySelectorAll('body *')].filter(visible).filter((el) => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed' && !inScroller(el));
    if (clipped.length) add('FAIL', 'clipped-right', `${clipped.length} elements past the right edge, e.g. ${clipped.slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ')[0]).join(' | ')}`);
    // text contrast (WCAG AA). Caught white-on-transparent buttons over light panels that every other check passed.
    // Background = the ancestor background stack blended over white. Any background-image in the chain (gradient, photo)
    // skips the run instead of guessing; wrap intentional exceptions in [data-ecc-contrast="skip"].
    const parseColor = (c) => {
      const srgb = c.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
      if (srgb) return [srgb[1] * 255, srgb[2] * 255, srgb[3] * 255, srgb[4] === undefined ? 1 : +srgb[4]];
      const m = c.match(/^rgba?\(([\d.]+),? ([\d.]+),? ([\d.]+)(?:[,/] ?([\d.]+))?\)/);
      return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
    };
    const over = (top, base) => [0, 1, 2].map((i) => top[i] * top[3] + base[i] * (1 - top[3]));
    const effectiveBg = (el) => {
      const stack = [];
      for (let n = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.backgroundImage !== 'none') return null;
        const c = parseColor(s.backgroundColor);
        if (!c) return null;
        if (c[3] > 0) stack.push(c);
        if (c[3] >= 1) break;
      }
      return stack.reverse().reduce((base, c) => over(c, base), [255, 255, 255]);
    };
    const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
    const lowFail = [], lowWarn = [], seen = new Set();
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const n = tw.currentNode; const el = n.parentElement;
      if (!n.textContent.trim() || !el || seen.has(el)) continue;
      seen.add(el);
      // WCAG exempts disabled controls
      if (!visible(el) || el.closest('[aria-hidden="true"], .sr-only, .visually-hidden, [data-ecc-contrast="skip"], :disabled, [aria-disabled="true"]')) continue;
      const s = getComputedStyle(el); const fg = parseColor(s.color); const bg = effectiveBg(el);
      if (!fg || !bg) continue;
      const r = ratio(over(fg, bg), bg);
      const px = parseFloat(s.fontSize); const large = px >= 24 || (px >= 18.66 && parseInt(s.fontWeight, 10) >= 700);
      const label = `${r.toFixed(2)}:1 "${n.textContent.trim().slice(0, 24)}"`;
      if (r < 3) lowFail.push(label); else if (r < (large ? 3 : 4.5)) lowWarn.push(label);
    }
    if (lowFail.length) add('FAIL', 'low-contrast', `${lowFail.length} text runs under 3:1, e.g. ${lowFail.slice(0, 3).join(' | ')}`);
    if (lowWarn.length) add('WARN', 'contrast-aa', `${lowWarn.length} text runs under AA 4.5:1, e.g. ${lowWarn.slice(0, 3).join(' | ')}`);
    // controls must use the page font: <button>, <input>, <select>, <textarea> do not inherit font-family by default
    const first = (f) => f.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
    const pageFont = first(getComputedStyle(document.body).fontFamily);
    const offFont = [...document.querySelectorAll('button, input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea')]
      .filter(visible).filter((el) => { const f = first(getComputedStyle(el).fontFamily); return f !== pageFont && !/mono|courier|menlo|consolas/.test(f); });
    if (offFont.length) add('WARN', 'control-font', `${offFont.length} controls not in ${pageFont}, e.g. ${offFont.slice(0, 3).map((e) => (e.id ? '#' + e.id : e.tagName.toLowerCase()) + ' ' + first(getComputedStyle(e).fontFamily)).join(' | ')}`);
    // scroll model: a scroll container that cannot scroll but traps the wheel (overscroll contain/none) is a dead
    // wheel zone, so the page only scrolls over the margins. Overlays (modal, drawer) are exempt.
    const dead = [...document.querySelectorAll('body *')].filter(visible).filter((el) => {
      const s = getComputedStyle(el); const b = el.getBoundingClientRect();
      if (!/auto|scroll/.test(s.overflowY) || s.position === 'fixed' || el.closest('[role="dialog"], .modal-overlay, .ecc-sidebar')) return false;
      return /contain|none/.test(s.overscrollBehaviorY) && b.width * b.height > innerWidth * innerHeight * 0.1;
    });
    if (dead.length) add('FAIL', 'scroll-trap', `${dead.length} large scrollers trap the wheel (overscroll contain/none), e.g. ${dead.slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ')[0]).join(' | ')}`);
    // fill the width: at desktop widths the widest visible content block should span most of the viewport
    if (innerWidth >= 1440) {
      const widest = Math.max(...[...document.querySelectorAll('body > *, body > * > *, main, [class*="container"], [class*="layout"]')].filter(visible).filter((e) => !['fixed', 'absolute'].includes(getComputedStyle(e).position)).map((e) => e.getBoundingClientRect().width));
      if (widest < innerWidth * 0.85) add('FAIL', 'width-underfilled', `widest content block is ${Math.round(widest)}px of ${innerWidth}px; fill to the --gutter`);
    }
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
  if (V2) {
    // AA text contrast is a gate in v2, not a WARN to answer
    for (const f of r.findings) if (f.code === 'contrast-aa') { f.severity = 'FAIL'; f.code = 'contrast-aa-v2'; }
    r.findings.push(...await page.evaluate(({ fieldSel }) => {
      const out = [];
      const add = (severity, code, msg) => out.push({ severity, code, msg });
      const visible = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      const name = (e) => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : ''));
      const parseColor = (c) => { const m = c.match(/^rgba?\(([\d.]+),? ([\d.]+),? ([\d.]+)(?:[,/] ?([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
      const over = (top, base) => [0, 1, 2].map((i) => top[i] * top[3] + base[i] * (1 - top[3]));
      const bgOf = (el) => { const stack = []; for (let n = el; n; n = n.parentElement) { const c = parseColor(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) stack.push(c); if (c && c[3] >= 1) break; } return stack.reverse().reduce((b, c) => over(c, b), [255, 255, 255]); };
      const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
      const list = (els, f) => els.slice(0, 3).map(f).join(' | ');
      // body text 20px; 18-19px paragraphs are v1 leftovers (17px stays the caption floor)
      const bodyPx = parseFloat(getComputedStyle(document.body).fontSize);
      if (bodyPx < 20) add('FAIL', 'v2-body-size', `body font-size ${bodyPx}px, v2 body is 20px (var(--text-body))`);
      const mid = [...document.querySelectorAll('p, li, dd, .ecc-msg')].filter(visible).filter((e) => !/eyebrow|label|caption/.test(String(e.className))).filter((e) => { const px = parseFloat(getComputedStyle(e).fontSize); return px > 17.5 && px < 19.5; });
      if (mid.length) add('WARN', 'v2-body-copy', `${mid.length} text blocks at 18-19px, v2 body copy is 20px, e.g. ${list(mid, (e) => name(e) + ' ' + getComputedStyle(e).fontSize)}`);
      // primary actions and text fields 56px
      // every text-entry control, independent of --field (which only narrows the v1 field-style checks)
      const V2_FIELDS = 'input:not([type]), input[type="text"], input[type="email"], input[type="search"], input[type="password"], input[type="number"], input[type="url"], input[type="tel"], textarea, select';
      const big = [...document.querySelectorAll(`.ecc-btn-primary, .ecc-btn--lg, button[type="submit"], ${V2_FIELDS}`)].filter(visible)
        .filter((e) => !e.closest('.ecc-hdr-band, [role="dialog"] header')).filter((e) => e.getBoundingClientRect().height < 55.5);
      if (big.length) add('FAIL', 'v2-control-height', `${big.length} primary buttons or fields under 56px, e.g. ${list(big, (e) => name(e) + ' ' + Math.round(e.getBoundingClientRect().height) + 'px')}`);
      // nav links and chips 48px
      const nav = [...document.querySelectorAll('nav a[href], .ecc-nav-link, .ecc-side-link, .ecc-chip, [role="tab"]')].filter(visible).filter((e) => e.getBoundingClientRect().height < 47.5);
      if (nav.length) add('FAIL', 'v2-target-min', `${nav.length} nav links or chips under 48px, e.g. ${list(nav, (e) => name(e) + ' ' + Math.round(e.getBoundingClientRect().height) + 'px')}`);
      // control boundaries 3:1 against what is behind them (fields and outlined buttons)
      // Known limit: a translucent border is blended over the parent background, not over the control's own fill
      // (background-clip). ECC borders are opaque, so this only matters for app-specific translucent borders.
      const weak = [...document.querySelectorAll(`${V2_FIELDS}, .ecc-btn-secondary, .ecc-choice, .ecc-task__check`)].filter(visible).filter((e) => {
        const s = getComputedStyle(e); if (parseFloat(s.borderTopWidth) < 1) return false;
        const c = parseColor(s.borderTopColor); if (!c) return false;
        const behind = bgOf(e.parentElement || document.body); return ratio(over(c, behind), behind) < 3;
      });
      if (weak.length) add('FAIL', 'v2-boundary-contrast', `${weak.length} control borders under 3:1, e.g. ${list(weak, name)}`);
      // current state must differ from its siblings in more than color (tint, border or weight)
      const cur = [...document.querySelectorAll('[aria-current]:not([aria-current="false"]), [aria-selected="true"]')].filter(visible);
      for (const e of cur.slice(0, 5)) {
        const box = e.closest('[role="tablist"], [role="menubar"], [role="list"], nav, ul, ol') || e.parentElement || document.body;
        const sib = [...box.querySelectorAll(e.tagName)].find((x) => x !== e && visible(x) && !x.matches('[aria-current]:not([aria-current="false"]), [aria-selected="true"]'));
        if (!sib) continue;
        const a = getComputedStyle(e), b = getComputedStyle(sib);
        const differs = ['backgroundColor', 'borderLeftColor', 'borderBottomColor', 'borderTopColor', 'fontWeight', 'boxShadow'].filter((k) => a[k] !== b[k]);
        if (!differs.length) add('WARN', 'v2-current-state', `${name(e)} looks the same as ${name(sib)}; mark current with tint, border or weight`);
      }
      return out;
    }, { fieldSel }));
    // focus ring 3:1 on a sample of controls, reached by keyboard so :focus-visible applies
    const sample = (await page.$$('a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select, textarea')).slice(0, 12);
    const weakRing = [], shadowRing = [];
    for (const h of sample) {
      if (!(await h.isVisible())) continue;
      const restShadow = await h.evaluate((e) => getComputedStyle(e).boxShadow);
      await page.keyboard.press('Shift');
      await h.focus();
      const res = await h.evaluate((e, restShadow) => {
        // inert or otherwise unfocusable (a closed drawer): nothing to measure
        if (document.activeElement !== e) return { skip: true };
        const s = getComputedStyle(e);
        const p = (c) => { const m = c.match(/^rgba?\(([\d.]+),? ([\d.]+),? ([\d.]+)(?:[,/] ?([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
        const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        // composite every background layer behind the control, not just the first opaque one
        const stack = []; for (let n = e.parentElement; n; n = n.parentElement) { const c = p(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) stack.push(c); if (c && c[3] >= 1) break; }
        const bg = stack.reverse().reduce((b, c) => [0, 1, 2].map((i) => c[i] * c[3] + b[i] * (1 - c[3])), [255, 255, 255]);
        const ring = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 ? p(s.outlineColor) : null;
        const id = e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : '');
        // a shadow counts only if focus added it (decorative card shadows are not rings); its contrast is not measured
        if (!ring) return s.boxShadow !== 'none' && s.boxShadow !== restShadow ? { id, ok: true, shadow: true } : { id, ok: false, why: 'no 2px outline or focus shadow' };
        // a translucent outline shows as its color blended over what is behind it
        const shown = [0, 1, 2].map((i) => ring[i] * ring[3] + bg[i] * (1 - ring[3]));
        const [hi, lo] = [lum(shown), lum(bg)].sort((a, b) => b - a); const r = (hi + 0.05) / (lo + 0.05);
        return { id, ok: r >= 3, why: `${r.toFixed(2)}:1` };
      }, restShadow);
      if (res.skip) continue;
      if (!res.ok) weakRing.push(`${res.id} ${res.why}`);
      else if (res.shadow) shadowRing.push(res.id);
    }
    if (shadowRing.length) r.findings.push({ severity: 'WARN', code: 'v2-focus-shadow', msg: `${shadowRing.length} focus indicators are shadows only, contrast not measured, e.g. ${shadowRing.slice(0, 3).join(' | ')}` });
    if (weakRing.length) r.findings.push({ severity: 'FAIL', code: 'v2-focus-ring', msg: `${weakRing.length} focus rings missing or under 3:1, e.g. ${weakRing.slice(0, 3).join(' | ')}` });
    // hover must change something on the first primary action
    const prim = await page.$('.ecc-btn-primary, .ecc-btn--lg, button[type="submit"]');
    if (prim && await prim.isVisible()) {
      const look = () => prim.evaluate((e) => { const s = getComputedStyle(e); return [s.backgroundColor, s.borderTopColor, s.color, s.boxShadow].join('|'); });
      // park the mouse away from controls first; buttons animate background over 0.15s
      await page.mouse.move(w - 2, 898); await page.waitForTimeout(250);
      const before = await look(); await prim.hover(); await page.waitForTimeout(400); const after = await look();
      if (before === after) r.findings.push({ severity: 'WARN', code: 'v2-hover-state', msg: 'first primary action has no hover change' });
      await page.mouse.move(0, 0);
    }
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

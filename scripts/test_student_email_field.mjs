#!/usr/bin/env node
// Regression checks for the fixed-domain student email field (docs/patterns/student-email-field.md).
// Synthetic responses and fictional demo.* usernames only.
//   node scripts/test_student_email_field.mjs        (serves the repo root on a free local port)
// Needs playwright (npm i --include=dev). Uses installed Chrome unless ECC_BROWSER_PATH is set.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize as pnorm } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { normalizeStudentEmail as n } from './fixtures/student-email-field.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
let failures = 0;
const check = async (name, fn) => {
  try { await fn(); console.log(`PASS ${name}`); } catch (e) { failures += 1; console.log(`FAIL ${name}: ${e.message}`); }
};

// ---- normalizer ----
await check('username normalizes to one full email', () => {
  assert.deepEqual(n('  Demo.User  '), { ok: true, username: 'demo.user', email: 'demo.user@ensign.edu' });
});
await check('full Ensign address is accepted without doubling', () => {
  assert.equal(n('Demo.User@Ensign.EDU').email, 'demo.user@ensign.edu');
});
await check('invalid inputs are rejected, never converted', () => {
  for (const bad of ['', '   ', 'demo user', 'demo.user@gmail.com', 'demo.user@ensign.edu.evil.test',
    'a@b@ensign.edu', '@ensign.edu', 'demo.user@', 'demo.user@ensign.edu@ensign.edu']) {
    assert.equal(n(bad).ok, false, `accepted ${JSON.stringify(bad)}`);
  }
});
await check('spelling is kept apart from case', () => {
  assert.equal(n('demo_user-2').email, 'demo_user-2@ensign.edu');
});

// ---- browser ----
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  const p = pnorm(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }).end(await readFile(p)); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/scripts/fixtures/student-email-lookup.html`;
const browser = await chromium.launch(process.env.ECC_BROWSER_PATH ? { executablePath: process.env.ECC_BROWSER_PATH } : { channel: process.env.ECC_BROWSER_CHANNEL || 'chrome' });
const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
const open = async () => { await page.goto(url); await page.waitForFunction(() => window.__lookupReady); };
const input = '#student-username';
const resultsVisible = () => page.isVisible('#lookup-results');
const shownEmail = () => page.textContent('#lookup-results [data-role="email"]');

await check('semantics: label, group, describedby, suffix text', async () => {
  await open();
  const a = await page.evaluate(() => {
    const i = document.getElementById('student-username');
    return { label: i.labels[0]?.textContent, group: i.parentElement.getAttribute('role'),
      desc: i.getAttribute('aria-describedby'), suffix: document.getElementById('student-suffix').textContent,
      editable: document.getElementById('student-suffix').isContentEditable };
  });
  assert.equal(a.label, 'Student email');
  assert.equal(a.group, 'group');
  assert.match(a.desc, /student-hint/); assert.match(a.desc, /student-suffix/); assert.match(a.desc, /student-error/);
  assert.equal(a.suffix, '@ensign.edu');
  assert.equal(a.editable, false);
});

await check('username entry sends one full email and shows it', async () => {
  await open();
  await page.fill(input, '  Demo.User ');
  await page.press(input, 'Enter');
  await page.waitForSelector('#lookup-results:not([hidden])');
  assert.equal(await shownEmail(), 'demo.user@ensign.edu');
  assert.match(await page.textContent('#lookup-status'), /demo\.user@ensign\.edu/);
});

await check('pasting a full Ensign address keeps only the username', async () => {
  await open();
  await page.focus(input);
  await page.evaluate(() => navigator.clipboard.writeText('Demo.User@ensign.edu'));
  await page.keyboard.press('ControlOrMeta+V');
  assert.equal(await page.inputValue(input), 'demo.user');
});

await check('pasting a foreign address is not converted and fails on submit', async () => {
  await open();
  await page.focus(input);
  await page.evaluate(() => navigator.clipboard.writeText('demo.user@gmail.com'));
  await page.keyboard.press('ControlOrMeta+V');
  assert.equal(await page.inputValue(input), 'demo.user@gmail.com');
  await page.press(input, 'Enter');
  assert.equal(await page.getAttribute(input, 'aria-invalid'), 'true');
  assert.equal(await page.isVisible('#student-error'), true);
  assert.equal(await resultsVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'student-username');
});

await check('invalid inputs mark the field and send nothing', async () => {
  for (const bad of ['', 'demo user', 'a@b@ensign.edu']) {
    await open();
    await page.fill(input, bad);
    await page.press(input, 'Enter');
    assert.equal(await page.getAttribute(input, 'aria-invalid'), 'true', bad);
    assert.equal(await page.textContent('#lookup-status'), '', bad);
  }
});

await check('clearing and re-entering hides old results and the error', async () => {
  await open();
  await page.fill(input, 'demo.user');
  await page.press(input, 'Enter');
  await page.waitForSelector('#lookup-results:not([hidden])');
  await page.fill(input, '');
  assert.equal(await resultsVisible(), false);
  await page.press(input, 'Enter');
  assert.equal(await page.getAttribute(input, 'aria-invalid'), 'true');
  await page.fill(input, 'demo.other');
  assert.equal(await page.getAttribute(input, 'aria-invalid'), null);
  await page.press(input, 'Enter');
  await page.waitForSelector('#lookup-results:not([hidden])');
  assert.equal(await shownEmail(), 'demo.other@ensign.edu');
});

await check('an edit hides results at once', async () => {
  await open();
  await page.fill(input, 'demo.user');
  await page.press(input, 'Enter');
  await page.waitForSelector('#lookup-results:not([hidden])');
  await page.type(input, 'x');
  assert.equal(await resultsVisible(), false);
});

await check('a slow response for an old identity is never shown', async () => {
  await open();
  await page.evaluate(() => { window.__lookupDelays['demo.user@ensign.edu'] = 700; });
  await page.fill(input, 'demo.user');
  await page.press(input, 'Enter');
  await page.fill(input, 'demo.other');
  await page.press(input, 'Enter');
  await page.waitForTimeout(1000);
  assert.equal(await shownEmail(), 'demo.other@ensign.edu');
  assert.match(await page.textContent('#lookup-status'), /demo\.other/);
});

await check('a pending response is dropped when the field is edited without resubmitting', async () => {
  await open();
  await page.evaluate(() => { window.__lookupDelays['demo.user@ensign.edu'] = 500; });
  await page.fill(input, 'demo.user');
  await page.press(input, 'Enter');
  await page.type(input, '2');
  await page.waitForTimeout(800);
  assert.equal(await resultsVisible(), false);
  assert.equal(await page.textContent('#lookup-status'), '');
});

for (const w of [320, 375, 768, 1440, 1920]) {
  await check(`layout at ${w}px: suffix fully visible, no page scroll, text 17px or more`, async () => {
    await page.setViewportSize({ width: w, height: 900 });
    await open();
    await page.fill(input, 'demo.user.with.a.long.fictional.name');
    const m = await page.evaluate(() => {
      const s = document.getElementById('student-suffix'); const i = document.getElementById('student-username');
      const sb = s.getBoundingClientRect(); const ib = i.getBoundingClientRect(); const cs = getComputedStyle(s);
      return { pageW: document.documentElement.scrollWidth, vw: innerWidth, sl: sb.left, sr: sb.right,
        clipped: s.scrollWidth > s.clientWidth + 1, ir: ib.right, it: ib.top, st: sb.top, sh: sb.height, ih: ib.height,
        shrink: cs.flexShrink, imin: getComputedStyle(i).minWidth, sf: parseFloat(cs.fontSize), ff: cs.fontFamily,
        hf: parseFloat(getComputedStyle(document.getElementById('student-hint')).fontSize), iw: ib.width };
    });
    assert.ok(m.pageW <= m.vw + 1, `page ${m.pageW}px wide`);
    assert.ok(m.sl >= 0 && m.sr <= m.vw, `suffix ${m.sl}-${m.sr} outside ${m.vw}`);
    assert.equal(m.clipped, false, 'suffix text clipped');
    assert.ok(Math.abs(m.ir - m.sl) <= 1 && Math.abs(m.it - m.st) <= 1, 'suffix not attached to the input');
    assert.equal(m.sh, m.ih, 'suffix and input heights differ');
    assert.equal(m.shrink, '0'); assert.equal(m.imin, '0px');
    assert.ok(m.sf >= 17 && m.hf >= 17, `text ${m.sf}/${m.hf}px`);
    assert.match(m.ff, /Montserrat/);
    assert.ok(m.iw >= 60, `username section only ${m.iw}px`);
    await page.focus(input);
    const ring = await page.$eval(input, (e) => getComputedStyle(e).outlineWidth);
    assert.ok(parseFloat(ring) >= 2, `focus outline ${ring}`);
  });
}

await check('gold is not used on the control', async () => {
  await open();
  const gold = await page.evaluate(() => [...document.querySelectorAll('.ecc-email-fixed, .ecc-email-fixed *')].some((e) => {
    const s = getComputedStyle(e); return [s.color, s.backgroundColor, s.borderTopColor, s.outlineColor].includes('rgb(253, 181, 21)');
  }));
  assert.equal(gold, false);
});

await browser.close();
server.close();
console.log(failures ? `${failures} FAIL` : 'ALL PASS');
process.exit(failures ? 1 : 0);

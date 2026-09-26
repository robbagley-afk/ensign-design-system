#!/usr/bin/env node
// Drive Rob's Coding Helper in the iMac's playwright-ensign Chrome (CDP 9226, ecenter24@ensign.net).
// Never closes the browser; only disconnects.
//   node helper_chat.mjs open [conversationUrl]   -> open agent (new chat) or a conversation
//   node helper_chat.mjs send <promptFile>        -> paste file text and press Enter
//   node helper_chat.mjs status                   -> url, stop button, last reply tail
//   node helper_chat.mjs extract <out.json>       -> expand code, save text from last 'diff --git'
//   node helper_chat.mjs cards                    -> list buttons that look like connection/consent cards
//   node helper_chat.mjs preflight                -> new chat; verify Sonnet and Opus GitHub against a canary; PASS | CARD | FAIL
//   HELPER_CONV=<id> selects which open conversation tab send/status/extract act on
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const AGENT = 'https://m365.cloud.microsoft/chat/agent/T_f14842f5-33be-4845-fed9-3991fee2e5ea.da0360c5-0abe-406e-ad17-e735f454fc15';
const [cmd, arg] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:9226');
const ctx = browser.contexts()[0];
const CONV = process.env.HELPER_CONV || '';
let page = ctx.pages().find(p => CONV && p.url().includes(CONV)) || ctx.pages().find(p => p.url().includes('m365.cloud.microsoft/chat'));
const out = (o) => { console.log(JSON.stringify(o, null, 1)); process.exit(0); };
if (cmd === 'open') {
  if (!page) page = await ctx.newPage();
  await page.goto(arg || AGENT, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  const login = /login\.microsoftonline|signin/i.test(page.url());
  out({ url: page.url(), title: await page.title(), loginWall: login, hasInput: !!(await page.$('[contenteditable="true"]')) });
}
if (!page && cmd !== 'preflight') out({ error: 'no M365 chat tab open; run: open' });
if (cmd === 'send') {
  const text = readFileSync(arg, 'utf8');
  const box = page.locator('[contenteditable="true"]').first();
  await box.click();
  await box.fill(text);
  const len = await box.evaluate(e => (e.innerText || '').length);
  if (len < text.length * 0.9) out({ error: 'paste short', want: text.length, got: len });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  out({ sent: text.length, pasted: len, url: page.url() });
}
if (cmd === 'status') {
  const r = await page.evaluate(() => ({ url: location.href, stop: !!document.querySelector('[aria-label*="Stop"]'), tail: document.body.innerText.slice(-1200) }));
  out(r);
}
if (cmd === 'extract') {
  const r = await page.evaluate(() => {
    [...document.querySelectorAll('button')].filter(b => /Show more lines/i.test(b.innerText)).forEach(b => b.click());
    const t = document.body.innerText; const s = t.lastIndexOf('diff --git');
    return { found: s >= 0, text: s >= 0 ? t.slice(s, t.indexOf("Message Rob's Coding Helper", s)) : '' };
  });
  writeFileSync(arg, JSON.stringify(r));
  out({ found: r.found, len: r.text.length, file: arg });
}
if (cmd === 'cards') {
  const r = await page.evaluate(() => [...document.querySelectorAll('button, a')].map(b => (b.innerText || b.getAttribute('aria-label') || '').trim()).filter(t => /sign in|allow|connect|consent|authori|permission/i.test(t)));
  out({ cards: r });
}
if (cmd === 'preflight') {
  // New chat, one probe for Sonnet (router GitHub) and Opus (its own GitHub). Canary: tokens/tokens.json lines 2-3 on main.
  // Hard-to-guess canaries from tokens/tokens.json as added in commit 29e18d0 (lines 22 and 27).
  const CANARY_A = ['The small status dot inside a positive status pill.', '#16a34a'];
  const CANARY_B = ['Scrim behind a mobile drawer or modal.', 'rgba(15,23,42,0.45)'];
  page = await ctx.newPage(); // never navigate a working conversation away
  await page.goto(AGENT, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(6000);
  const probe = 'Connection check, answered separately. Part A (you, the Sonnet router): use your GitHub tool get_commit with the full patch on commit 29e18d04c15c4d23750af34c652b51bba058a00a in robbagley-afk/ensign-design-system and quote the complete line of tokens/tokens.json that contains the token name success-icon, exactly, including its usage text. Part B: send a NEW request to your Opus specialist and paste its reply verbatim (do not answer for it): Opus, use your own GitHub tool with get_commit full patch on the same commit and quote the complete line of tokens/tokens.json that contains the token name overlay, exactly, including its usage text. Label A and B. If either cannot get the text, say CONNECTION NEEDED for that part and do not guess.';
  const box = page.locator('[contenteditable="true"]').first(); await box.click(); await box.fill(probe); await page.keyboard.press('Enter');
  let r = {};
  for (let i = 0; i < 48; i++) {
    await page.waitForTimeout(5000);
    r = await page.evaluate(() => { const t = document.body.innerText; const i = t.lastIndexOf('Connection check, answered separately'); return { stop: !!document.querySelector('[aria-label*="Stop"]'), reply: t.slice(i), cards: [...document.querySelectorAll('button,a')].map(b => (b.innerText || '').trim()).filter(x => /connection manager|^sign in$|^allow$|^connect$/i.test(x)) }; });
    if (r.cards.length || (!r.stop && /\bB\b|CONNECTION NEEDED/.test(r.reply.split('said:').pop() || ''))) break;
  }
  // Each part has its own distinct canary, so check the whole reply; drop Microsoft's feedback survey if it pops up.
  const ans = ((r.reply.split('said:').pop() || '').split('Microsoft would love your perspective')[0]);
  const a = ans, b = ans;
  const okA = (x) => CANARY_A.every(c => x.includes(c)); const okB = (x) => CANARY_B.every(c => x.includes(c));
  const status = r.cards.length ? 'CARD' : (okA(a) && okB(b)) ? 'PASS' : 'FAIL';
  out({ status, conversation: page.url(), cards: r.cards, sonnetOk: okA(a), opusOk: okB(b), connectionNeeded: /CONNECTION NEEDED/.test(ans), replyTail: ans.slice(-600) });
}
out({ error: 'unknown command' });

// dispatch.mjs <jobs.json> [--lane NAME] [--max N]
// Runs Rob's Coding Helper block batches in parallel on ONE claimed lane, then applies replies in order.
// jobs.json: [{"id":"mc-1","blocks":"mc.blocks.json","from":1,"to":13,"files":["app.css"],"rules":"rules_ecc.txt"}]
//   "rules" optional (default blocks.py's rules_ecc.txt). Relative paths resolve against the jobs file's folder.
//   Keep each batch near 5,000 prompt characters (10 to 15 blocks).
//   "engine":"qwen" (block jobs only): try local Qwen first (qwen.mjs run code). Qwen down, busy or bad reply falls back
//     to the helper lane in the same run. Use it for mechanical rewrites (token swaps, emoji, scaling), never for fixes
//     that need design judgment. Report shows "qwen" or "qwen->helper".
//   Review job: {"id":"rv-mc","kind":"review","prompt":"review_mc.txt","min":400}. Fresh chat, the prompt file as is,
//     nonce appended. OK needs the nonce and at least "min" characters (default 400). Nothing is applied: read
//     <outRoot>/<jobs>/<id>.raw.txt and verify every finding against the code before acting.
// Each job: its own minimized window, prompt = rules header + blocks + nonce line LAST (the header stays a
//   byte-identical prefix, which keeps any prompt cache on Microsoft's side warm). The reply must carry its own
//   nonce, no other job's nonce, and every marker, or it is not applied.
// Applies: per CSS file, strictly in jobs-file order, one at a time. Generation runs ahead of applies.
//   Each apply also holds <locks>/files/<sha1 of path>, so a second dispatch (other lane, other agent) waits instead of
//   editing the same file at the same moment. A lock whose pid is dead is reclaimed. Wait limit 10 min, then the job FAILs.
// Lanes: lanes.json. Claim = mkdir <locks>/<lane> (atomic). A lock whose pid is dead is reclaimed.
// Tiny or partial reply: one "Please continue" in the same chat. Service error: OK + continue, 3 times max.
// Throttle text: halve concurrency, wait 60 s, retry the job. Four throttles: stop, exit 4 (use --lane edge1).
// Output: one line per job, then one DISPATCH line. Files: <outRoot>/<jobs name>/<id>.{prompt,raw,reply}.txt
// Exit: 0 all OK, 1 some jobs failed, 2 lane busy/down, 3 login wall or connect card (Rob acts), 4 throttled.
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { execFileSync, execFile } from 'node:child_process'; import { randomBytes, createHash } from 'node:crypto';
import { promisify } from 'node:util'; const execFileP = promisify(execFile);
const HERE = path.dirname(new URL(import.meta.url).pathname), BLOCKS = path.join(HERE, 'blocks.py');
const home = p => p.replace(/^~/, os.homedir()), sleep = ms => new Promise(r => setTimeout(r, ms));
const REG = JSON.parse(fs.readFileSync(path.join(HERE, 'lanes.json'), 'utf8'));
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const jobsFile = path.resolve(args[0]), JD = path.dirname(jobsFile), rp = p => path.isAbsolute(p) ? p : path.join(JD, p);
const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8')).map(j => ({ files: [], ...j }));
const isReview = j => j.kind === 'review', wantOf = j => (isReview(j) ? 0 : j.to - j.from + 1);
const lane = REG.lanes.find(l => l.name === (opt('--lane') || REG.lanes.find(x => x.role === 'primary').name));
if (!lane || !['primary', 'failover'].includes(lane.role)) { console.log('DISPATCH lane not dispatchable'); process.exit(2); }
let MAX = +(opt('--max') || lane.maxChats || 8);
const outDir = path.join(home(REG.outRoot), path.basename(jobsFile, '.json')); fs.mkdirSync(outDir, { recursive: true });
const T0 = Date.now(), secs = () => Math.round((Date.now() - T0) / 1000);

// ---- claim / release ----
const lockDir = path.join(home(REG.locks), lane.name), ownerF = path.join(lockDir, 'owner.json');
fs.mkdirSync(path.dirname(lockDir), { recursive: true });
const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
try { fs.mkdirSync(lockDir); } catch {
  let o = {}; try { o = JSON.parse(fs.readFileSync(ownerF, 'utf8')); } catch {}
  if (o.pid && alive(o.pid)) { console.log(`DISPATCH lane ${lane.name} busy: pid ${o.pid} since ${o.since} (${o.jobs})`); process.exit(2); }
  fs.rmSync(lockDir, { recursive: true, force: true }); fs.mkdirSync(lockDir);
}
fs.writeFileSync(ownerF, JSON.stringify({ pid: process.pid, since: new Date().toISOString(), jobs: jobsFile }));
const release = () => { try { if (JSON.parse(fs.readFileSync(ownerF, 'utf8')).pid === process.pid) fs.rmSync(lockDir, { recursive: true, force: true }); } catch {} };
process.on('exit', release); for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => { release(); process.exit(130); });

// ---- lane health, tidy, connect ----
const base = 'http://127.0.0.1:' + lane.port;
const up = async () => { try { return (await fetch(base + '/json/version', { signal: AbortSignal.timeout(3000) })).ok; } catch { return false; } };
if (!(await up())) {
  execFileSync('launchctl', ['kickstart', `gui/${process.getuid()}/${lane.launchd}`]);
  for (let i = 0; i < 30 && !(await up()); i++) await sleep(1000);
  if (!(await up())) { console.log(`DISPATCH lane ${lane.name} down after kickstart`); process.exit(2); }
  await sleep(23000); // launcher trims tabs at 6 s and 21 s
}
const tidy = () => execFileSync(process.execPath, [path.join(HERE, 'tidy.mjs'), String(lane.port)], { encoding: 'utf8' }).trim();
tidy();
const b = await chromium.connectOverCDP(base); const ctx = b.contexts()[0]; const BS = await b.newBrowserCDPSession();

// ---- one job ----
const BOX = '[contenteditable="true"]', CONT = 'Please continue your previous answer from where it stopped.';
const BUSY = /Lining things up|Gathering details|Thinking…|Working on it|Generating|Digging in|Putting it together|Hang on a sec|Give me a moment|One moment/i;
const STALL_MS = 240000, STALL_REVIEW_MS = 600000; // no new text for 4 min (reviews 10: the Opus specialist is slow): stop it, retry once in a fresh chat
const THROTTLE = /too many requests|rate limit|reached (your|the) [^.]{0,40}limit|usage limit|try again later/i;
class Stop extends Error { constructor(code, msg) { super(msg); this.code = code; } }
async function jobPage() { // own minimized window, so the lane's main window keeps one tab
  const { targetId } = await BS.send('Target.createTarget', { url: REG.agentUrl, newWindow: true, background: true });
  const { windowId } = await BS.send('Browser.getWindowForTarget', { targetId });
  await BS.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } }).catch(() => {});
  for (let k = 0; k < 40; k++) {
    for (const p of ctx.pages()) { const c = await ctx.newCDPSession(p); const { targetInfo } = await c.send('Target.getTargetInfo'); await c.detach(); if (targetInfo.targetId === targetId) return p; }
    await sleep(500);
  }
  throw new Error('job window not found');
}
// Send and confirm. Sent means a new "You said:" bubble or a Stop button within 15 s, never "the box looks empty"
// (the box keeps placeholder and code-fence markup). Only an unsent prompt is sent again, so nothing is doubled.
// A prompt that never left the box is what made a "Please continue" land in an empty chat (edge1, 2026-09-26).
async function ask(p, text) {
  const box = p.locator(BOX).first();
  const said = () => p.evaluate(() => (document.body.innerText.match(/You said:/g) || []).length).catch(() => 0);
  const busy = () => p.evaluate(() => !!document.querySelector('[aria-label*="Stop"]')).catch(() => false);
  const n0 = await said();
  for (let k = 0; k < 2; k++) {
    await box.click(); await box.fill(text); await p.keyboard.press('Enter');
    for (let s = 0; s < 15; s++) { await sleep(1000); if ((await said()) > n0 || (await busy())) return; }
    await box.fill('');
  }
  throw new Error('send not confirmed after 2 tries');
}
async function waitIdle(p, ts, stallMs = STALL_MS) {
  let prev = '', errs = 0, changed = Date.now();
  while (Date.now() - ts < 900000) {
    await sleep(8000);
    const s = await p.evaluate(() => { const t = document.body.innerText; return { stop: !!document.querySelector('[aria-label*="Stop"]'), tail: t.slice(-1500), len: t.length }; });
    if (THROTTLE.test(s.tail.slice(-800))) return { throttled: true };
    if (/something went wrong|Service unavailable|wasn.t able to respond/i.test(s.tail.slice(-800))) {
      if (++errs > 3) return { failed: 'repeated service errors' };
      const ok = p.getByRole('button', { name: /^ok$/i }); if (await ok.count()) await ok.first().click();
      await sleep(3000); await ask(p, CONT); prev = ''; continue;
    }
    const key = s.tail.slice(-600) + s.len, idle = !s.stop && !BUSY.test(s.tail.slice(-400));
    if (idle && key === prev && Date.now() - ts > 15000) return { errs };
    if (key !== prev) changed = Date.now();
    else if (Date.now() - changed > stallMs) { await p.locator('[aria-label*="Stop"]').first().click().catch(() => {}); return { stalled: true }; }
    prev = key;
  }
  return { failed: 'timeout 15 min' };
}
const cut = t => { const i = t.search(/\/\*\s*#\d+/); if (i < 0) return ''; const e = Math.min(...['Show less', 'Message Rob'].map(m => t.indexOf(m, i)).filter(k => k > 0), t.length); return t.slice(i, e); };
const lastReply = async p => { const t = await p.evaluate(() => { [...document.querySelectorAll('button')].filter(x => /Show more lines/i.test(x.innerText)).forEach(x => x.click()); return document.body.innerText; }); const i = t.lastIndexOf('said:'); return i < 0 ? '' : t.slice(i); }; // no reply yet = empty, never the page tail
function buildPrompt(j, nonce) { // saved so a lost conversation reruns from the file, never from memory
  const pf = path.join(outDir, j.id + '.prompt.txt');
  if (isReview(j)) { fs.writeFileSync(pf, fs.readFileSync(rp(j.prompt), 'utf8').trimEnd() + `\n\nEnd your reply with this exact line: ${nonce}\nJOB ${nonce}\n`); return pf; }
  execFileSync('python3', [BLOCKS, 'prompt', rp(j.blocks), String(j.from), String(j.to), pf], { env: { ...process.env, ...(j.rules ? { HELPER_RULES: rp(j.rules) } : {}) } });
  fs.writeFileSync(pf, fs.readFileSync(pf, 'utf8').trimEnd() + `\nFirst line inside your code block must be: /* ${nonce} */\nJOB ${nonce}\n`);
  return pf;
}
const checkReply = (r, reply) => { r.len = reply.length; r.nonceOK = reply.includes(r.nonce); r.foreign = (reply.match(/NX-[0-9a-f]{8}/g) || []).filter(x => x !== r.nonce).length; r.markers = new Set((reply.match(/\/\*\s*#(\d+)/g) || []).map(x => x.replace(/\D/g, ''))).size; };
const short = (j, r) => (isReview(j) ? r.len < (j.min || 400) : r.len < 300 || r.markers < r.want);
// Local Qwen attempt for "engine":"qwen" block jobs. Returns a result, or null when Qwen is down, busy or wrong (helper takes it).
async function runQwen(j) { // async so helper chats in other workers keep polling while Qwen generates
  const nonce = 'NX-' + randomBytes(4).toString('hex'), r = { id: j.id, nonce, want: wantOf(j), msgs: 0, engine: 'qwen' }, pf = buildPrompt(j, nonce);
  const raw = path.join(outDir, j.id + '.raw.txt'), ts = Date.now();
  try { await execFileP(process.execPath, [path.join(HERE, 'qwen.mjs'), 'run', 'code', pf, raw, '--wait', '30'], { encoding: 'utf8' }); }
  catch (e) { const why = (String(e.stdout || '').match(/"reason":"([^"]+)"/) || [])[1] || 'exit ' + (e.code ?? e.status); console.log(`QWEN ${j.id}: ${why}, sending to helper lane`); return null; }
  const reply = fs.readFileSync(raw, 'utf8'); checkReply(r, reply);
  if (!r.nonceOK || r.foreign || r.markers < r.want) { console.log(`QWEN ${j.id}: reply failed checks (markers ${r.markers}/${r.want}), sending to helper lane`); return null; }
  fs.writeFileSync(path.join(outDir, j.id + '.reply.txt'), cut(reply)); r.gen = Math.round((Date.now() - ts) / 1000);
  return r;
}
async function run(j) {
  const nonce = 'NX-' + randomBytes(4).toString('hex'), want = wantOf(j), r = { id: j.id, nonce, want, msgs: 0, engine: j.engine === 'qwen' ? 'qwen->helper' : 'helper' };
  const text = fs.readFileSync(buildPrompt(j, nonce), 'utf8');
  const p = await jobPage();
  try {
    await p.waitForLoadState('domcontentloaded'); await sleep(10000);
    const u = p.url();
    if (/login\.(microsoftonline|live)\.com|id\.churchofjesuschrist\.org|okta/.test(u)) throw new Stop(3, `LOGIN WALL on ${lane.name}: Rob signs in as ${lane.account}, then reruns`);
    if (/Open connection manager|Connect to continue/i.test(await p.evaluate(() => document.body.innerText))) throw new Stop(3, 'CONNECT CARD: select Connect, choose robbagley-afk, rerun');
    if (!(await p.locator(BOX).count())) throw new Stop(3, 'no chat box at ' + u.slice(0, 70));
    const ts = Date.now(); await ask(p, text); r.msgs++;
    let w = await waitIdle(p, ts, isReview(j) ? STALL_REVIEW_MS : STALL_MS); if (w.throttled || w.stalled) { Object.assign(r, w.throttled ? { throttled: true } : { stalled: true }); return r; }
    const body_ = t => (isReview(j) ? t : cut(t));
    let reply = await lastReply(p), body = body_(reply);
    const check = () => checkReply(r, reply);
    check();
    if (!w.failed && short(j, r)) { // tiny error reply or cut-off answer: one continue. No reply at all: resend the prompt.
      await ask(p, reply ? CONT : text); r.msgs++; if (!reply) { reply = ''; body = ''; r.resent = true; } w = await waitIdle(p, Date.now(), isReview(j) ? STALL_REVIEW_MS : STALL_MS); if (w.throttled || w.stalled) { Object.assign(r, w.throttled ? { throttled: true } : { stalled: true }); return r; }
      const more = await lastReply(p); reply = reply + '\n' + more; body = body + '\n' + body_(more); check(); r.continued = true;
    }
    if (isReview(j) && short(j, r)) r.error = `review reply ${r.len} chars, under ${j.min || 400}`;
    if (w.failed) r.error = w.failed;
    r.conv = (p.url().split('/conversation/')[1] || '').slice(0, 36); r.gen = Math.round((Date.now() - ts) / 1000);
    fs.writeFileSync(path.join(outDir, j.id + '.raw.txt'), reply);
    fs.writeFileSync(path.join(outDir, j.id + '.reply.txt'), body);
  } finally { await p.close().catch(() => {}); }
  return r;
}

// ---- applies: per CSS file, strictly in jobs-file order ----
const gates = jobs.map(() => []), tails = new Map();
jobs.forEach((j, i) => { for (const f of j.files.map(rp)) { let done; const d = new Promise(r => (done = r)); gates[i].push({ f, prev: tails.get(f) || Promise.resolve(), done }); tails.set(f, d); } });
const fileLocks = path.join(home(REG.locks), 'files'); fs.mkdirSync(fileLocks, { recursive: true });
async function lockFile(f) { // cross-dispatch: one writer per file, dead-pid locks reclaimed, 10 min limit
  const d = path.join(fileLocks, createHash('sha1').update(path.resolve(f)).digest('hex').slice(0, 16)), t0 = Date.now();
  while (true) {
    try { fs.mkdirSync(d); fs.writeFileSync(d + '/owner', JSON.stringify({ pid: process.pid, file: f })); return () => fs.rmSync(d, { recursive: true, force: true }); }
    catch { let o = {}; try { o = JSON.parse(fs.readFileSync(d + '/owner', 'utf8')); } catch {} if (o.pid && !alive(o.pid)) { fs.rmSync(d, { recursive: true, force: true }); continue; } }
    if (Date.now() - t0 > 600000) throw new Error('file lock held 10 min: ' + path.basename(f));
    await sleep(1000);
  }
}
async function applyJob(i, r) {
  const rf = path.join(outDir, jobs[i].id + '.reply.txt'); r.applied = 0;
  const good = !r.error && r.nonceOK && !r.foreign && fs.existsSync(rf);
  for (const g of gates[i]) {
    await g.prev; let unlock = () => {};
    try { if (good) { unlock = await lockFile(g.f); const o = execFileSync('python3', [BLOCKS, 'apply', g.f, rp(jobs[i].blocks), rf], { encoding: 'utf8' }); r.applied += +((o.match(/applied (\d+)/) || [])[1] || 0); } }
    catch (e) { r.error = 'apply: ' + String(e.message || e).slice(0, 80); }
    finally { unlock(); g.done(); }
  }
}
let nOK = 0, msgs = 0;
function report(r) {
  const ok = !r.error && r.nonceOK && !r.foreign && r.markers >= r.want && r.applied === r.want;
  if (ok) nOK++; msgs += r.msgs || 0;
  const what = r.want ? `markers ${r.markers ?? 0}/${r.want} applied ${r.applied ?? 0}/${r.want}` : `review ${r.len ?? 0} chars`;
  console.log(`JOB ${r.id} ${ok ? 'OK' : r.applied ? 'PARTIAL' : 'FAIL'} ${r.engine || 'helper'} gen ${r.gen ?? '-'}s ${what}` +
    `${r.continued ? " continued" : ""}${r.resent ? " resent" : ""}${r.foreign ? ' FOREIGN-NONCE' : ''}${r.nonceOK === false ? ' NONCE-MISSING' : ''} conv ${r.conv || '-'}${r.error ? ' ERR ' + r.error : ''}`);
}

// ---- pool ----
const queue = jobs.map((_, i) => i); let active = 0, stop = null, throttles = 0, lastStart = 0;
const halt = e => { stop = stop || e; for (const i of queue) gates[i].forEach(g => g.done()); };
async function worker() {
  while (!stop) {
    if (!queue.length) { if (!active) return; await sleep(1000); continue; }
    if (active >= MAX || Date.now() - lastStart < 1500) { await sleep(300); continue; }
    const i = queue.shift(); active++; lastStart = Date.now();
    try {
      let r = null;
      if (jobs[i].engine === 'qwen' && !isReview(jobs[i]) && !jobs[i]._qwenTried) { jobs[i]._qwenTried = true; r = await runQwen(jobs[i]); }
      if (!r) r = await run(jobs[i]);
      if (r.stalled && !jobs[i]._retried) { jobs[i]._retried = true; msgs += r.msgs; console.log(`STALLED ${jobs[i].id} (conv ${r.conv || '-'}): retrying once in a new chat`); queue.unshift(i); continue; }
      if (r.stalled) r.error = 'stalled twice';
      if (r.throttled) {
        msgs += r.msgs;
        if (++throttles > 3) { gates[i].forEach(g => g.done()); halt(new Stop(4, `THROTTLED ${throttles}x on ${lane.name}: wait, or rerun unfinished jobs with --lane edge1`)); }
        else { MAX = Math.max(1, Math.floor(MAX / 2)); console.log(`THROTTLED ${jobs[i].id}: concurrency now ${MAX}, retry in 60 s`); await sleep(60000); queue.unshift(i); }
      } else { await applyJob(i, r); report(r); }
    } catch (e) {
      if (e instanceof Stop) { gates[i].forEach(g => g.done()); halt(e); }
      else { const r = { id: jobs[i].id, want: wantOf(jobs[i]), error: String(e).slice(0, 100) }; await applyJob(i, r); report(r); }
    } finally { active--; }
  }
}
await Promise.all([...Array(Math.min(MAX, jobs.length))].map(worker));
for (const i of queue) console.log(`JOB ${jobs[i].id} NOT-RUN`);
try { tidy(); } catch {}
console.log(`DISPATCH ${stop ? 'STOPPED ' + stop.message : 'done'} lane ${lane.name} ok ${nOK}/${jobs.length} helper-msgs ${msgs} wall ${secs()}s concurrency ${MAX} out ${outDir}`);
process.exit(stop ? stop.code : nOK === jobs.length ? 0 : 1);

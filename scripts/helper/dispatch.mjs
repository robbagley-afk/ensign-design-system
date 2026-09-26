// dispatch.mjs <jobs.json> [--lane NAME] [--max N]
// Runs Rob's Coding Helper block batches in parallel on ONE claimed lane, then applies replies in order.
// jobs.json: [{"id":"mc-1","blocks":"mc.blocks.json","from":1,"to":13,"files":["app.css"],"rules":"rules_ecc.txt"}]
//   "rules" optional (default blocks.py's rules_ecc.txt). Relative paths resolve against the jobs file's folder.
//   Keep each batch near 5,000 prompt characters (10 to 15 blocks).
// Each job: its own minimized window, prompt = rules header + blocks + nonce line LAST (the header stays a
//   byte-identical prefix, which keeps any prompt cache on Microsoft's side warm). The reply must carry its own
//   nonce, no other job's nonce, and every marker, or it is not applied.
// Applies: per CSS file, strictly in jobs-file order, one at a time. Generation runs ahead of applies.
// Lanes: lanes.json. Claim = mkdir <locks>/<lane> (atomic). A lock whose pid is dead is reclaimed.
// Tiny or partial reply: one "Please continue" in the same chat. Service error: OK + continue, 3 times max.
// Throttle text: halve concurrency, wait 60 s, retry the job. Four throttles: stop, exit 4 (use --lane edge1).
// Output: one line per job, then one DISPATCH line. Files: <outRoot>/<jobs name>/<id>.{prompt,raw,reply}.txt
// Exit: 0 all OK, 1 some jobs failed, 2 lane busy/down, 3 login wall or connect card (Rob acts), 4 throttled.
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { execFileSync } from 'node:child_process'; import { randomBytes } from 'node:crypto';
const HERE = path.dirname(new URL(import.meta.url).pathname), BLOCKS = path.join(HERE, 'blocks.py');
const home = p => p.replace(/^~/, os.homedir()), sleep = ms => new Promise(r => setTimeout(r, ms));
const REG = JSON.parse(fs.readFileSync(path.join(HERE, 'lanes.json'), 'utf8'));
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const jobsFile = path.resolve(args[0]), JD = path.dirname(jobsFile), rp = p => path.isAbsolute(p) ? p : path.join(JD, p);
const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
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
const BUSY = /Lining things up|Gathering details|Thinking…|Working on it|Generating|Digging in/i;
const STALL_MS = 240000; // Stop button up but no new text for 4 min: stop it, retry once in a fresh chat
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
async function ask(p, text) { const box = p.locator(BOX).first(); await box.click(); await box.fill(text); await p.keyboard.press('Enter'); }
async function waitIdle(p, ts) {
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
    else if (Date.now() - changed > STALL_MS) { await p.locator('[aria-label*="Stop"]').first().click().catch(() => {}); return { stalled: true }; }
    prev = key;
  }
  return { failed: 'timeout 15 min' };
}
const cut = t => { const i = t.search(/\/\*\s*#\d+/); if (i < 0) return ''; const e = Math.min(...['Show less', 'Message Rob'].map(m => t.indexOf(m, i)).filter(k => k > 0), t.length); return t.slice(i, e); };
const lastReply = async p => { const t = await p.evaluate(() => { [...document.querySelectorAll('button')].filter(x => /Show more lines/i.test(x.innerText)).forEach(x => x.click()); return document.body.innerText; }); return t.slice(t.lastIndexOf('said:')); };
async function run(j) {
  const nonce = 'NX-' + randomBytes(4).toString('hex'), want = j.to - j.from + 1, r = { id: j.id, nonce, want, msgs: 0 };
  const pf = path.join(outDir, j.id + '.prompt.txt');
  execFileSync('python3', [BLOCKS, 'prompt', rp(j.blocks), String(j.from), String(j.to), pf], { env: { ...process.env, ...(j.rules ? { HELPER_RULES: rp(j.rules) } : {}) } });
  const text = fs.readFileSync(pf, 'utf8').trimEnd() + `\nFirst line inside your code block must be: /* ${nonce} */\nJOB ${nonce}\n`;
  fs.writeFileSync(pf, text); // saved so a lost conversation reruns from the file, never from memory
  const p = await jobPage();
  try {
    await p.waitForLoadState('domcontentloaded'); await sleep(10000);
    const u = p.url();
    if (/login\.(microsoftonline|live)\.com/.test(u)) throw new Stop(3, `LOGIN WALL on ${lane.name}: Rob signs in as ${lane.account}, then reruns`);
    if (/Open connection manager|Connect to continue/i.test(await p.evaluate(() => document.body.innerText))) throw new Stop(3, 'CONNECT CARD: select Connect, choose robbagley-afk, rerun');
    if (!(await p.locator(BOX).count())) throw new Stop(3, 'no chat box at ' + u.slice(0, 70));
    const ts = Date.now(); await ask(p, text); r.msgs++;
    let w = await waitIdle(p, ts); if (w.throttled || w.stalled) { Object.assign(r, w.throttled ? { throttled: true } : { stalled: true }); return r; }
    let reply = await lastReply(p), body = cut(reply);
    const check = () => { r.len = reply.length; r.nonceOK = reply.includes(nonce); r.foreign = (reply.match(/NX-[0-9a-f]{8}/g) || []).filter(x => x !== nonce).length; r.markers = new Set((reply.match(/\/\*\s*#(\d+)/g) || []).map(x => x.replace(/\D/g, ''))).size; };
    check();
    if (!w.failed && (r.len < 300 || r.markers < want)) { // tiny error reply or cut-off answer: one continue
      await ask(p, CONT); r.msgs++; w = await waitIdle(p, Date.now()); if (w.throttled || w.stalled) { Object.assign(r, w.throttled ? { throttled: true } : { stalled: true }); return r; }
      const more = await lastReply(p); reply = reply + '\n' + more; body = body + '\n' + cut(more); check(); r.continued = true;
    }
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
async function applyJob(i, r) {
  const rf = path.join(outDir, jobs[i].id + '.reply.txt'); r.applied = 0;
  const good = !r.error && r.nonceOK && !r.foreign && fs.existsSync(rf);
  for (const g of gates[i]) {
    await g.prev;
    try { if (good) { const o = execFileSync('python3', [BLOCKS, 'apply', g.f, rp(jobs[i].blocks), rf], { encoding: 'utf8' }); r.applied += +((o.match(/applied (\d+)/) || [])[1] || 0); } }
    catch (e) { r.error = 'apply: ' + String(e).slice(0, 80); }
    finally { g.done(); }
  }
}
let nOK = 0, msgs = 0;
function report(r) {
  const ok = !r.error && r.nonceOK && !r.foreign && r.markers === r.want && r.applied === r.want;
  if (ok) nOK++; msgs += r.msgs || 0;
  console.log(`JOB ${r.id} ${ok ? 'OK' : r.applied ? 'PARTIAL' : 'FAIL'} gen ${r.gen ?? '-'}s markers ${r.markers ?? 0}/${r.want} applied ${r.applied ?? 0}/${r.want}` +
    `${r.continued ? ' continued' : ''}${r.foreign ? ' FOREIGN-NONCE' : ''}${r.nonceOK === false ? ' NONCE-MISSING' : ''} conv ${r.conv || '-'}${r.error ? ' ERR ' + r.error : ''}`);
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
      const r = await run(jobs[i]);
      if (r.stalled && !jobs[i]._retried) { jobs[i]._retried = true; msgs += r.msgs; console.log(`STALLED ${jobs[i].id} (conv ${r.conv || '-'}): retrying once in a new chat`); queue.unshift(i); continue; }
      if (r.stalled) r.error = 'stalled twice';
      if (r.throttled) {
        msgs += r.msgs;
        if (++throttles > 3) { gates[i].forEach(g => g.done()); halt(new Stop(4, `THROTTLED ${throttles}x on ${lane.name}: wait, or rerun unfinished jobs with --lane edge1`)); }
        else { MAX = Math.max(1, Math.floor(MAX / 2)); console.log(`THROTTLED ${jobs[i].id}: concurrency now ${MAX}, retry in 60 s`); await sleep(60000); queue.unshift(i); }
      } else { await applyJob(i, r); report(r); }
    } catch (e) {
      if (e instanceof Stop) { gates[i].forEach(g => g.done()); halt(e); }
      else { const r = { id: jobs[i].id, want: jobs[i].to - jobs[i].from + 1, error: String(e).slice(0, 100) }; await applyJob(i, r); report(r); }
    } finally { active--; }
  }
}
await Promise.all([...Array(Math.min(MAX, jobs.length))].map(worker));
for (const i of queue) console.log(`JOB ${jobs[i].id} NOT-RUN`);
try { tidy(); } catch {}
console.log(`DISPATCH ${stop ? 'STOPPED ' + stop.message : 'done'} lane ${lane.name} ok ${nOK}/${jobs.length} helper-msgs ${msgs} wall ${secs()}s concurrency ${MAX} out ${outDir}`);
process.exit(stop ? stop.code : nOK === jobs.length ? 0 : 1);

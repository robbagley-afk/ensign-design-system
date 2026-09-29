// qwen.mjs -- local Qwen offload for the helper loop (LM Studio on the Mac Studio). Zero Claude tokens, zero Copilot credits.
//   node qwen.mjs health                                  -> one JSON line: {ok, model, models, reason}
//   node qwen.mjs run <profile> <in.txt> <out.txt> [--schema s.json] [--image a.png]... [--timeout secs]
//   node qwen.mjs screen <shot.png>...                    -> one line per shot: SCREEN <file> OK | FLAG ... | SKIP ...
// Exit: 0 ok. 10 QWEN DOWN (host offline, LM Studio down, no eligible model LOADED). 11 QWEN BUSY (no free slot,
//   timeout, HTTP 429/503). 12 BAD OUTPUT (empty, invalid JSON, cut at max_tokens). 2 usage.
// Fallback is the caller's job and never Claude subagents: rewrites go to the helper lanes (dispatch.mjs does this
//   for "engine":"qwen" jobs), a skipped screen means the supervisor views every screenshot itself.
// Safety rules (Mac Studio M1 Ultra 64 GB, see Mem 4ea782de / 00a58d7e):
//   - Only calls a model that is ALREADY LOADED. Never names an unloaded model: LM Studio would JIT-load it, and a
//     third heavy model on the host freezes the machine. Never qwen38-27b or bu-30b (on-demand, owned by the keepalive
//     and lms-heavy-guard). Text jobs: qwen3-vl-30b-a3b-instruct-mlx, else a loaded qwen3-14b. Images: the 30B VL only.
//   - Slots: career apps share the 30B's 4 parallel slots. Weekdays 08-17 America/Denver this script takes at most 2,
//     otherwise 4. Slot = atomic mkdir under locks/qwen, dead-pid locks are reclaimed.
//   - Every call sends reasoning_effort none (verified on LM Studio 0.4.25: "off" returns 400) plus /no_think.
// Endpoint: $LM_STUDIO_URL (iMac and other clients: https://mac-studio-2.tail299fc7.ts.net:1234/v1, hostname form only),
//   else loopback http://127.0.0.1:1234/v1 (on the Mac Studio itself).
// Profiles are per phase, not per app. Qwen3 card defaults (0.7/0.8/20, presence 1.5) suit chat, not one-right-answer work.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { execFileSync } from 'node:child_process';
const PROFILES = {
  extract: { temperature: 0.15, top_p: 0.8, top_k: 20, presence_penalty: 0, max_tokens: 4000 }, // facts, classify, JSON
  code:    { temperature: 0.2,  top_p: 0.8, top_k: 20, presence_penalty: 0, max_tokens: 6000 }, // mechanical block rewrites
  screen:  { temperature: 0.1,  top_p: 0.8, top_k: 20, presence_penalty: 0, max_tokens: 800 },  // screenshot defect flags
  synth:   { temperature: 0.35, top_p: 0.9, top_k: 20, presence_penalty: 0, max_tokens: 4000 }, // summaries, reconcile
};
// Desktop Commander and launchd shells do not load ~/.zshrc, so with no $LM_STUDIO_URL a client (ROLE="client" in
// ~/.cowork-machine-id) uses the Serve hostname and anything else uses loopback.
const role = (() => { try { return (fs.readFileSync(path.join(os.homedir(), '.cowork-machine-id'), 'utf8').match(/ROLE="?(\w+)/) || [])[1]; } catch { return ''; } })();
const URL_ = (process.env.LM_STUDIO_URL || (role === 'client' ? 'https://mac-studio-2.tail299fc7.ts.net:1234/v1' : 'http://127.0.0.1:1234/v1')).replace(/\/$/, ''), ROOT = URL_.replace(/\/v1$/, '');
const LOCKS = path.join(os.homedir(), 'Local-Infra/ui-audit/_helper/locks/qwen');
const VL = 'qwen3-vl-30b-a3b-instruct-mlx', TEXT_OK = [VL, /qwen3-14b/], NEVER = /27b|qwen38|bu-30b/i;
const [cmd, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const multi = k => rest.flatMap((x, i) => (rest[i - 1] === k ? [x] : []));
const die = (code, o) => { console.log(JSON.stringify(o)); process.exit(code); };
const get = async (u, ms = 4000) => { const r = await fetch(u, { signal: AbortSignal.timeout(ms) }); if (!r.ok) throw Object.assign(new Error('HTTP ' + r.status), { status: r.status }); return r.json(); };

// ---- which models are loaded right now (never trust /v1/models alone: with JIT on it lists every downloaded model)
async function loaded() {
  try { const d = await get(ROOT + '/api/v0/models'); return d.data.filter(m => m.state === 'loaded').map(m => m.id); }
  catch (e) { if (e.status !== 404) throw e; }
  const d = await get(ROOT + '/api/v1/models');
  return (d.models || d.data || []).flatMap(m => (m.loaded_instances || []).map(x => x.id || m.key));
}
function pick(ids, needVision) {
  const ok = ids.filter(id => !NEVER.test(id));
  if (ok.includes(VL)) return VL;
  if (needVision) return null;
  return ok.find(id => TEXT_OK.some(t => (t instanceof RegExp ? t.test(id) : t === id))) || null;
}
async function health(needVision = false) {
  let ids; try { ids = await loaded(); } catch (e) { return { ok: false, url: URL_, reason: 'unreachable: ' + (e.cause?.code || e.message) }; }
  const model = pick(ids, needVision);
  return model ? { ok: true, model, models: ids } : { ok: false, models: ids, reason: needVision ? 'no vision model loaded' : 'no eligible model loaded' };
}

// ---- slots
function cap() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return !['Sat', 'Sun'].includes(p.weekday) && +p.hour >= 8 && +p.hour < 17 ? 2 : 4;
}
const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
let held = null;
async function takeSlot(waitSecs) {
  fs.mkdirSync(LOCKS, { recursive: true });
  const t0 = Date.now();
  while (true) {
    const n = cap(); // snapshot once per pass
    for (let k = 1; k <= n; k++) {
      const d = path.join(LOCKS, 'slot-' + k);
      try { fs.mkdirSync(d); fs.writeFileSync(d + '/pid', String(process.pid)); held = d; return true; }
      catch { // reclaim a dead owner, or a slot whose pid file never got written (owner killed between mkdir and write)
        let pid = 0, age = 0; try { pid = parseInt(fs.readFileSync(d + '/pid', 'utf8'), 10) || 0; } catch {}
        try { age = Date.now() - fs.statSync(d).mtimeMs; } catch { k--; continue; } // vanished: retry this slot now
        if ((pid > 0 && !alive(pid)) || (!pid && age > 10000)) { fs.rmSync(d, { recursive: true, force: true }); k--; }
      }
    }
    if ((Date.now() - t0) / 1000 > waitSecs) return false;
    await new Promise(r => setTimeout(r, 2000));
  }
}
const freeSlot = () => { if (held) { fs.rmSync(held, { recursive: true, force: true }); held = null; } };
process.on('exit', freeSlot); for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => process.exit(130));

// ---- one chat call. Returns {code, text, ...}
function imagePart(file) {
  return { type: 'image_url', image_url: { url: 'data:image/png;base64,' + fs.readFileSync(file).toString('base64') } };
}
async function chat(profile, text, { images = [], schema = null, timeout = 180 } = {}) {
  const h = await health(images.length > 0);
  if (!h.ok) return { code: 10, reason: h.reason };
  if (!(await takeSlot(+opt('--wait', 60)))) return { code: 11, reason: `no free slot (cap ${cap()})` };
  const P = PROFILES[profile]; if (!P) return { code: 2, reason: 'unknown profile ' + profile };
  const content = images.length ? [{ type: 'text', text: '/no_think\n' + text }, ...images.map(imagePart)] : '/no_think\n' + text;
  const body = { model: h.model, messages: [{ role: 'user', content }], ...P, repeat_penalty: 1.0, seed: 3407, reasoning_effort: 'none', stream: false };
  if (schema) body.response_format = { type: 'json_schema', json_schema: { name: 'out', strict: true, schema } };
  const t0 = Date.now();
  try {
    const r = await fetch(URL_ + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeout * 1000) });
    if ([429, 503].includes(r.status)) return { code: 11, reason: 'HTTP ' + r.status };
    if (!r.ok) return { code: 10, reason: 'HTTP ' + r.status + ' ' + (await r.text()).slice(0, 120) };
    const j = await r.json(), c = j.choices?.[0], out = (c?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const meta = { model: h.model, secs: Math.round((Date.now() - t0) / 1000), tokens: j.usage?.completion_tokens };
    if (!out) return { code: 12, reason: 'empty reply', ...meta };
    if (c.finish_reason === 'length') return { code: 12, reason: 'cut at max_tokens', ...meta };
    if (schema) { try { JSON.parse(out); } catch { return { code: 12, reason: 'invalid JSON', ...meta }; } }
    return { code: 0, text: out, ...meta };
  } catch (e) {
    return e.name === 'TimeoutError' ? { code: 11, reason: `timeout ${timeout}s` } : { code: 10, reason: 'request failed: ' + (e.cause?.code || e.message) };
  } finally { freeSlot(); }
}

// ---- screen: tall full-page shots are cut into tiles about 1.2 x width high, each scaled to 1280 px wide, so small
// text stays readable. Needs macOS sips. Tiles live in a temp dir and are removed after the run.
const SCREEN_SCHEMA = { type: 'object', additionalProperties: false, required: ['ok', 'flags'], properties: { ok: { type: 'boolean' },
  flags: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['issue', 'where'], properties: { issue: { type: 'string' }, where: { type: 'string' } } } } } };
const SCREEN_PROMPT = `You check one screenshot tile of a web page for visual defects. Report only these:
- text with low contrast against what is behind it (white or pale text on white or pale background, dark on dark)
- text clipped, cut off, or overflowing its box
- elements overlapping each other
- content cut at the right edge or a horizontal scrollbar
- broken or missing images, raw unstyled HTML
Do not judge taste, color choice, spacing or layout style. "where" names the visible text or element nearest the defect.
If there is no defect, return ok true and an empty flags list.`;
function tiles(file, dir) {
  const g = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
  const W = +g.match(/pixelWidth: (\d+)/)[1], H = +g.match(/pixelHeight: (\d+)/)[1], step = Math.round(W * 1.2), out = [];
  for (let y = 0, i = 0; y < H; y += step, i++) {
    const t = path.join(dir, `${path.basename(file, '.png')}_${i}.png`), h = Math.min(step, H - y);
    execFileSync('sips', ['-c', String(h), String(W), '--cropOffset', String(y), '0', file, '--out', t], { stdio: 'ignore' });
    if (W > 1280) execFileSync('sips', ['--resampleWidth', '1280', t], { stdio: 'ignore' });
    out.push({ t, y });
  }
  return out;
}

// ---- commands
if (cmd === 'health') { const h = await health(rest.includes('--vision')); die(h.ok ? 0 : 10, h); }
if (cmd === 'run') {
  const [profile, inF, outF] = rest; if (!outF) die(2, { error: 'usage: run <profile> <in.txt> <out.txt>' });
  const schemaF = opt('--schema'), r = await chat(profile, fs.readFileSync(inF, 'utf8'),
    { images: multi('--image'), schema: schemaF ? JSON.parse(fs.readFileSync(schemaF, 'utf8')) : null, timeout: +opt('--timeout', 180) });
  if (r.code === 0) fs.writeFileSync(outF, r.text);
  const { text, ...info } = r; die(r.code, { ...info, profile, out: r.code === 0 ? outF : undefined });
}
if (cmd === 'screen') {
  const shots = rest.filter(x => x.endsWith('.png')); if (!shots.length) die(2, { error: 'usage: screen <shot.png>...' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qwen-screen-')); let flagged = 0;
  try {
    for (const s of shots) {
      const found = [];
      for (const { t, y } of tiles(s, dir)) {
        const r = await chat('screen', SCREEN_PROMPT, { images: [t], schema: SCREEN_SCHEMA, timeout: 120 });
        if (r.code === 10 || r.code === 11) { console.log(`QWEN ${r.code === 10 ? 'DOWN' : 'BUSY'} (${r.reason}): prescreen skipped, view every screenshot yourself`); process.exit(r.code); }
        if (r.code !== 0) { found.push(`tile@${y}px unreadable reply (${r.reason})`); continue; }
        for (const f of JSON.parse(r.text).flags) found.push(`@${y}px ${f.issue} [${f.where}]`);
      }
      if (found.length) flagged++;
      console.log(`SCREEN ${path.basename(s)} ${found.length ? 'FLAG ' + found.length + ': ' + found.join(' | ') : 'OK'}`);
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  console.log(`SCREENED ${shots.length} flagged ${flagged}. View every FLAG shot plus one OK shot per page yourself.`);
  process.exit(0);
}
die(2, { error: 'usage: health | run <profile> <in> <out> | screen <png>...' });

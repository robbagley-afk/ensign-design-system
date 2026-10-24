import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile), here = path.dirname(new URL(import.meta.url).pathname);
const agent = 'https://m365.cloud.microsoft/chat/agent/T_f14842f5';
async function fixture(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'helper-lifecycle-'));
  const requests = [], closed = [], pages = ['anchor', 'review-a', 'review-b'].map(id => ({ id, type: 'page', url: agent }));
  const server = http.createServer((req, res) => {
    requests.push(req.url); res.setHeader('Content-Type', 'application/json');
    if (req.url === '/json/list') res.end(JSON.stringify(pages));
    else if (req.url.startsWith('/json/close/')) { closed.push(req.url.split('/').pop()); res.end('true'); }
    else res.end('{}');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port, root = path.join(home, 'Local-Infra/browser-lanes');
  fs.mkdirSync(path.join(root, `${port}.lock`), { recursive: true });
  fs.writeFileSync(path.join(root, 'lane_lock.sh'), '#!/bin/sh\necho "BUSY: live shared owner" >&2\nexit 1\n', { mode: 0o755 });
  fs.writeFileSync(path.join(root, `${port}.lock/owner.json`), JSON.stringify({ port, pid: process.pid, tool: 'another-live-driver' }));
  t.after(() => { server.close(); fs.rmSync(home, { recursive: true, force: true }); });
  return { home, port, root, requests, closed, env: { ...process.env, HOME: home } };
}
test('late launcher tidy leaves every active review target open while a driver owns the shared port', async t => {
  const f = await fixture(t);
  const { stdout } = await exec(process.execPath, [path.join(here, 'tidy.mjs'), String(f.port)], { env: f.env });
  assert.deepEqual(f.closed, [], 'late startup cleanup must not destroy either parallel review');
  assert.equal(f.requests.length, 0, 'ownership must be checked before any browser operation');
  assert.match(stdout, /deferred|busy/i);
});
test('a missing shared lock helper fails closed before browser cleanup', async t => {
  const f = await fixture(t);
  fs.unlinkSync(path.join(f.root, 'lane_lock.sh'));
  const r = await exec(process.execPath, [path.join(here, 'tidy.mjs'), String(f.port)], { env: f.env }).catch(e => e);
  assert.deepEqual(f.closed, []);
  assert.equal(f.requests.length, 0);
  assert.match(r.stdout, /deferred|busy/i);
});
test('dispatcher rejects a shared lane owner before tidy or CDP even if the private dispatch lock is free', async t => {
  const f = await fixture(t), dir = path.join(f.home, 'driver'); fs.mkdirSync(dir);
  for (const name of ['dispatch.mjs', 'tidy.mjs', 'lane-ownership.mjs', 'agent-url.mjs']) if (fs.existsSync(path.join(here, name))) fs.copyFileSync(path.join(here, name), path.join(dir, name));
  const pkg = path.join(dir, 'node_modules/playwright'); fs.mkdirSync(pkg, { recursive: true });
  fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ type: 'module', exports: './index.mjs' }));
  fs.writeFileSync(path.join(pkg, 'index.mjs'), "export const chromium={connectOverCDP(){throw new Error('CDP MUST NOT BE REACHED')}};");
  fs.writeFileSync(path.join(dir, 'lanes.json'), JSON.stringify({ agentUrl: agent, locks: path.join(f.home, 'private-locks'), outRoot: path.join(f.home, 'out'), lanes: [{ name: 'test', role: 'primary', port: f.port }] }));
  fs.writeFileSync(path.join(dir, 'jobs.json'), '[]');
  fs.writeFileSync(path.join(f.root, 'lane_lock.sh'), '#!/bin/sh\necho "BUSY: live shared driver" >&2\nexit 1\n', { mode: 0o755 });
  const r = await exec(process.execPath, [path.join(dir, 'dispatch.mjs'), path.join(dir, 'jobs.json')], { env: f.env }).catch(e => e);
  assert.equal(r.code, 2, r.stderr);
  assert.equal(f.requests.length, 0, 'busy shared lane must never be driven');
  assert.match(r.stdout, /busy|BUSY/i);
  assert.ok(fs.existsSync(path.join(f.root, `${f.port}.lock/owner.json`)), 'foreign lock survives');
});
test('dispatch waits until delayed launcher cleanup has actually finished', async () => {
  const { waitForLauncherIdle } = await import('./lane-ownership.mjs');
  const states = ['state = running', 'state = running', 'state = not running'];
  let reads = 0, sleeps = 0;
  await waitForLauncherIdle('test-launcher', { readState: () => { reads++; return states.shift(); }, sleep: async () => { sleeps++; } });
  assert.equal(reads, 3); assert.equal(sleeps, 2);
});
test('a launcher that never completes is rejected without creating job targets', async () => {
  const { waitForLauncherIdle } = await import('./lane-ownership.mjs');
  await assert.rejects(waitForLauncherIdle('test-launcher', { readState: () => 'state = running', sleep: async () => {}, attempts: 2 }), /still running/);
});
async function dispatchFixture(f, connectSource) {
  const dir = path.join(f.home, 'dispatch-success'); fs.mkdirSync(dir);
  for (const name of ['dispatch.mjs', 'tidy.mjs', 'lane-ownership.mjs', 'agent-url.mjs']) fs.copyFileSync(path.join(here, name), path.join(dir, name));
  const pkg = path.join(dir, 'node_modules/playwright'); fs.mkdirSync(pkg, { recursive: true });
  fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ type: 'module', exports: './index.mjs' }));
  fs.writeFileSync(path.join(pkg, 'index.mjs'), `export const chromium={connectOverCDP:async()=>{${connectSource}}};`);
  fs.writeFileSync(path.join(dir, 'lanes.json'), JSON.stringify({ agentUrl: agent, locks: path.join(f.home, 'private-locks'), outRoot: path.join(f.home, 'out'), lanes: [{ name: 'test', role: 'primary', port: f.port, launchd: 'fake-helper-launcher' }] }));
  fs.writeFileSync(path.join(dir, 'jobs.json'), '[]');
  fs.rmSync(path.join(f.root, `${f.port}.lock`), { recursive: true });
  fs.writeFileSync(path.join(f.root, 'lane_lock.sh'), `#!/bin/sh
printf '%s\\n' "$*" >> "$HOME/lock-events"
d="$HOME/Local-Infra/browser-lanes/$2.lock"
if [ "$1" = acquire ]; then mkdir "$d" || exit 1; printf '{"pid":%s}' "$4" > "$d/owner.json"; else rm "$d/owner.json"; rmdir "$d"; fi
`, { mode: 0o755 });
  const bin = path.join(f.home, 'bin'); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'launchctl'), '#!/bin/sh\necho "state = not running"\n', { mode: 0o755 });
  return { dir, env: { ...f.env, PATH: `${bin}:${process.env.PATH}` } };
}
test('successful dispatch preserves pre-existing tabs and releases both shared and private ownership', async t => {
  const f = await fixture(t), d = await dispatchFixture(f, 'return {contexts:()=>[{}],newBrowserCDPSession:async()=>({})};');
  const r = await exec(process.execPath, [path.join(d.dir, 'dispatch.mjs'), path.join(d.dir, 'jobs.json'), '--no-recovery'], { env: d.env });
  assert.match(r.stdout, /DISPATCH done/);
  assert.equal(f.requests.length, 1, 'only endpoint health is read, with no whole-lane tidy');
  assert.deepEqual(f.closed, []);
  assert.equal(fs.existsSync(path.join(f.root, `${f.port}.lock`)), false);
  assert.equal(fs.existsSync(path.join(f.home, 'private-locks/test')), false);
  const events = fs.readFileSync(path.join(f.home, 'lock-events'), 'utf8').trim().split('\n');
  assert.equal(events.length, 2);
  assert.match(events[0], new RegExp(`^acquire ${f.port} coding-helper-dispatch \\d+$`));
  assert.equal(events[1], `release ${f.port} ${events[0].split(' ').pop()}`);
});
test('CDP failure releases owned locks without closing foreign targets or retrying', async t => {
  const f = await fixture(t), d = await dispatchFixture(f, "throw new Error('connection failed');");
  const r = await exec(process.execPath, [path.join(d.dir, 'dispatch.mjs'), path.join(d.dir, 'jobs.json'), '--no-recovery'], { env: d.env }).catch(e => e);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /connection failed/);
  assert.deepEqual(f.closed, []);
  assert.equal(fs.existsSync(path.join(f.root, `${f.port}.lock`)), false);
  assert.equal(fs.existsSync(path.join(f.home, 'private-locks/test')), false);
});

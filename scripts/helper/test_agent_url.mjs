import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolveAgent, agentForJob } from './agent-url.mjs';
const exec = promisify(execFile), here = path.dirname(new URL(import.meta.url).pathname);
const HELPER = 'https://m365.cloud.microsoft/chat/agent/T_f14842f5-33be-4845-fed9-3991fee2e5ea.da0360c5-0abe-406e-ad17-e735f454fc15';
const SAVER = 'https://m365.cloud.microsoft/chat/agent/T_45c4f56f-36ee-1db8-5d94-81612ae405a6.80ad698a-d6b4-4676-8731-b997e6fa08c7';
const REG = { agentUrl: HELPER, agents: { helper: HELPER, 'token-saver': SAVER } };
test('no override keeps Rob\'s Coding Helper', () => {
  assert.deepEqual(resolveAgent(undefined, REG), { name: 'helper', url: HELPER });
  assert.deepEqual(agentForJob({ id: 'a' }, undefined, REG), { name: 'helper', url: HELPER });
});
test('alias and full URL both resolve, and a known URL keeps its alias name', () => {
  assert.deepEqual(resolveAgent('token-saver', REG), { name: 'token-saver', url: SAVER });
  assert.deepEqual(resolveAgent(SAVER, REG), { name: 'token-saver', url: SAVER });
  const other = 'https://m365.cloud.microsoft/chat/agent/T_3bcb2c8e-11f2-d741-b68c-39809c1717c9.2c655192-7542-435f-8911-53a381985f2c';
  assert.deepEqual(resolveAgent(other, REG), { name: 'custom', url: other });
});
test('job agent beats --agent, which beats the registry default', () => {
  assert.equal(agentForJob({ agent: 'helper' }, 'token-saver', REG).name, 'helper');
  assert.equal(agentForJob({}, 'token-saver', REG).name, 'token-saver');
});
test('unknown alias or non-M365 URL throws', () => {
  assert.throws(() => resolveAgent('tokensaver', REG), /unknown agent/);
  assert.throws(() => resolveAgent('https://evil.example.com/chat/agent/T_1.2', REG), /unknown agent/);
  assert.throws(() => resolveAgent('toString', REG), /unknown agent/);
});
async function driver(t, jobs) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-url-')), dir = path.join(home, 'driver'); fs.mkdirSync(dir);
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  for (const name of ['dispatch.mjs', 'lane-ownership.mjs', 'agent-url.mjs']) fs.copyFileSync(path.join(here, name), path.join(dir, name));
  const pkg = path.join(dir, 'node_modules/playwright'); fs.mkdirSync(pkg, { recursive: true });
  fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ type: 'module', exports: './index.mjs' }));
  fs.writeFileSync(path.join(pkg, 'index.mjs'), "export const chromium={connectOverCDP(){throw new Error('CDP MUST NOT BE REACHED')}};");
  const marker = path.join(home, 'lane-touched');
  const root = path.join(home, 'Local-Infra/browser-lanes'); fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'lane_lock.sh'), `#!/bin/sh\ntouch '${marker}'\nexit 0\n`, { mode: 0o755 });
  fs.writeFileSync(path.join(dir, 'lanes.json'), JSON.stringify({ ...REG, locks: path.join(home, 'locks'), outRoot: path.join(home, 'out'), lanes: [{ name: 'test', role: 'primary', port: 1 }] }));
  fs.writeFileSync(path.join(dir, 'jobs.json'), JSON.stringify(jobs));
  const run = async (...extra) => exec(process.execPath, [path.join(dir, 'dispatch.mjs'), path.join(dir, 'jobs.json'), ...extra], { env: { ...process.env, HOME: home } }).catch(e => e);
  return { run, marker };
}
test('dispatch exits 1 on a bad agent before claiming the lane or reaching CDP', async t => {
  const { run, marker } = await driver(t, [{ id: 'rv', kind: 'review', prompt: 'p.txt', agent: 'nope' }]);
  const r = await run();
  assert.equal(r.code, 1, r.stderr);
  assert.match(r.stdout, /DISPATCH bad agent: unknown agent "nope"/);
  assert.equal(fs.existsSync(marker), false, 'lane lock helper must not run');
});
test('a bare, empty or option-valued --agent fails instead of falling back to the helper', async t => {
  const { run, marker } = await driver(t, [{ id: 'rv', kind: 'review', prompt: 'p.txt' }]);
  for (const extra of [['--agent'], ['--agent', ''], ['--agent', '--max', '2']]) {
    const r = await run(...extra);
    assert.equal(r.code, 1, `${extra.join(' ')}: ${r.stderr}`);
    assert.match(r.stdout, /DISPATCH bad agent: --agent needs an alias or URL/);
  }
  assert.equal(fs.existsSync(marker), false, 'lane lock helper must not run');
});

// Shared CDP ownership uses the fleet lock helper, never the dispatch-only lock.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
export function claimSharedLane(port, tool) {
  const script = path.join(os.homedir(), 'Local-Infra/browser-lanes/lane_lock.sh');
  if (!fs.existsSync(script)) throw new Error('shared lane_lock.sh is missing; refusing browser access');
  try { execFileSync(script, ['acquire', String(port), tool, String(process.pid)], { encoding: 'utf8', stdio: 'pipe' }); }
  catch (e) { throw new Error(String(e.stderr || e.stdout || e.message).trim()); }
  let held = true;
  return () => {
    if (!held) return;
    // Release only this exact PID through the same owner protocol.
    execFileSync(script, ['release', String(port), String(process.pid)], { encoding: 'utf8', stdio: 'pipe' });
    held = false;
  };
}
export async function waitForLauncherIdle(label, { readState, sleep = ms => new Promise(r => setTimeout(r, ms)), attempts = 60 } = {}) {
  const read = readState || (() => execFileSync('launchctl', ['print', `gui/${process.getuid()}/${label}`], { encoding: 'utf8', stdio: 'pipe' }));
  // DevTools readiness precedes the launcher's delayed cleanup. Wait for its
  // actual exit even when the endpoint was already up when dispatch started.
  for (let i = 0; i < attempts; i++) {
    if (!/^\s*state = running\s*$/m.test(await read())) return;
    await sleep(1000);
  }
  throw new Error('lane launcher still running; refusing to create review targets');
}

// lane_stop.mjs <port>  -- graceful shutdown of a helper lane browser through DevTools Browser.close.
// Same as choosing Quit: Edge records exit_type Normal, so the next launch shows no "Restore pages" prompt.
// SIGTERM with windows open records SessionEnded, which Edge treats as interrupted. Never kill -9.
// Waits up to 20 s for DevTools to go quiet, then reports. Only for lanes Claude owns (lanes.json).
const port = process.argv[2];
if (!port) { console.error('usage: lane_stop.mjs <port>'); process.exit(2); }
const base = 'http://127.0.0.1:' + port;
let ws;
try { ws = (await (await fetch(base + '/json/version', { signal: AbortSignal.timeout(3000) })).json()).webSocketDebuggerUrl; }
catch { console.log(JSON.stringify({ port, state: 'not running' })); process.exit(0); }
const sock = new WebSocket(ws);
await new Promise((ok, bad) => { sock.onopen = ok; sock.onerror = bad; });
sock.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 500));
  try { await fetch(base + '/json/version', { signal: AbortSignal.timeout(1000) }); } catch { console.log(JSON.stringify({ port, state: 'closed', secs: (i + 1) / 2 })); process.exit(0); }
}
console.log(JSON.stringify({ port, state: 'still running after 20 s: report to Rob, do not force' }));
process.exit(1);

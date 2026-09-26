// tidy.mjs <port> [keepUrlPart]  -- leave exactly ONE tab on a helper lane.
// Uses the DevTools HTTP endpoints (/json/list, /json/close, /json/new), so it works even when the
// browser has no window left (macOS keeps Edge running after its last window closes).
// Keeps the best tab: blank helper chat > helper conversation > new-tab page > anything else.
// Zero tabs: opens one on the helper agent so the lane is usable again. Never closes the last tab.
// Run at lane start (launcher), when a lane is claimed, and after every job. Only on lanes Claude owns.
const AGENT = 'https://m365.cloud.microsoft/chat/agent/T_f14842f5-33be-4845-fed9-3991fee2e5ea.da0360c5-0abe-406e-ad17-e735f454fc15';
const [port, keep = '/chat/agent/T_f14842f5'] = process.argv.slice(2);
const base = 'http://127.0.0.1:' + port;
const pages = (await (await fetch(base + '/json/list')).json()).filter(t => t.type === 'page');
if (!pages.length) {
  await fetch(base + '/json/new?' + encodeURIComponent(AGENT), { method: 'PUT' });
  console.log(JSON.stringify({ port, before: 0, closed: 0, opened: 1 })); process.exit(0);
}
const score = t => t.url.includes(keep) ? (t.url.includes('/conversation/') ? 2 : 3) : (t.url.startsWith('edge://') || t.url.includes('ntp.msn') ? 1 : 0);
const keeper = [...pages].sort((a, z) => score(z) - score(a))[0];
let closed = 0;
for (const t of pages) if (t.id !== keeper.id) { const r = await fetch(base + '/json/close/' + t.id); if (r.ok) closed++; }
console.log(JSON.stringify({ port, before: pages.length, closed, kept: keeper.url.slice(0, 90) }));

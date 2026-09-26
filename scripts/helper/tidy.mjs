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
const SSO = /id\.churchofjesuschrist\.org|okta|login\.microsoftonline\.com|login\.live\.com/; // Ensign signs in through the Church Okta and Microsoft SSO
const score = t => t.url.includes(keep) ? (t.url.includes('/conversation/') ? 2 : 3) : SSO.test(t.url) ? 1.5 : (t.url.startsWith('edge://') || t.url.includes('ntp.msn') ? 1 : 0);
let keeper = [...pages].sort((a, z) => score(z) - score(a))[0];
// A sign-in page (score 1.5) is kept as is: the lane is mid-login and Rob finishes it. Otherwise, with no helper tab
// (Edge restored unrelated tabs on 2026-09-26), open the agent first, then close everything else.
if (score(keeper) < 1.5) keeper = await (await fetch(base + '/json/new?' + encodeURIComponent(AGENT), { method: 'PUT' })).json();
let closed = 0;
for (const t of pages) if (t.id !== keeper.id) { const r = await fetch(base + '/json/close/' + t.id); if (r.ok) closed++; }
console.log(JSON.stringify({ port, before: pages.length, closed, kept: keeper.url.slice(0, 90) }));

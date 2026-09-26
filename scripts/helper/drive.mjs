// drive.mjs <cmd> [arg]  -- Claude's own tab; never touches other tabs.
//  load <convUrl>        open/retry a conversation (clicks error OK + reloads up to 4x)
//  new                   open a new chat tab for the agent; prints tab url
//  send <convOrNew> <file>  paste + Enter in that tab ('new' = most recent tab Claude opened on agent page)
//  wait <conv> [secs]    poll until no Stop button; clicks error OK and retries last prompt via 'Please continue'
//  convs [text]         list sidebar chats (id + first words); filter by text. Use to get a new chat's id or recover an unrecorded one
//  read <conv> <out>     expand code, save full last reply text
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const AGENT='https://m365.cloud.microsoft/chat/agent/T_f14842f5-33be-4845-fed9-3991fee2e5ea.da0360c5-0abe-406e-ad17-e735f454fc15';
const [cmd,a1,a2]=process.argv.slice(2);
const b=await chromium.connectOverCDP('http://127.0.0.1:9226'); const ctx=b.contexts()[0];
const out=o=>{console.log(JSON.stringify(o,null,1));process.exit(0)};
async function findAsync(id){ if(!id.startsWith('text:')) return ctx.pages().find(p=>p.url().includes(id));
  const m=id.slice(5); for(const p of ctx.pages()){ if(!p.url().includes('m365')) continue; if(await p.evaluate(m=>document.body.innerText.includes(m),m)) return p; } }
const find=id=>ctx.pages().find(p=>p.url().includes(id));
async function errOk(p){ // "Sorry, something went wrong" dialog
  const t=await p.evaluate(()=>document.body.innerText);
  if(/something went wrong|Service unavailable/i.test(t)){ const ok=p.getByRole('button',{name:/^ok$/i}); if(await ok.count()){await ok.first().click(); return true;} }
  return false;
}
async function load(url){ let p=find(url.split('/').pop()); if(!p){p=await ctx.newPage();}
  for(let i=0;i<5;i++){ await p.goto(url,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(12000);
    const e=await errOk(p); const has=await p.evaluate(()=>/said:/.test(document.body.innerText));
    if(!e&&has) return {p,tries:i+1}; await p.waitForTimeout(5000);} return {p,tries:5,failed:true}; }
if(cmd==='load'){const r=await load(a1); const t=await r.p.evaluate(()=>document.body.innerText); out({tries:r.tries,failed:!!r.failed,tail:t.slice(-2500)});}
if(cmd==='new'){const p=await ctx.newPage(); await p.goto(AGENT,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(10000); await errOk(p); out({url:p.url(),hasInput:!!(await p.$('[contenteditable="true"]'))});}
if(cmd==='send'){const p=a1==='new'?ctx.pages().filter(p=>p.url().startsWith(AGENT)&&!p.url().includes('/conversation/')).pop():find(a1);
  if(!p) out({error:'tab not found'}); const text=readFileSync(a2,'utf8'); const box=p.locator('[contenteditable="true"]').first();
  await box.click(); await box.fill(text); const len=await box.evaluate(e=>(e.innerText||'').length);
  if(len<text.length*0.9) out({error:'paste short',want:text.length,got:len});
  await p.keyboard.press('Enter'); await p.waitForTimeout(8000); out({sent:text.length,pasted:len,url:p.url()});}
if(cmd==='wait'){const p=await findAsync(a1); const lim=+(a2||600); const t0=Date.now(); let retries=0; let prev='';
  while((Date.now()-t0)/1000<lim){ await p.waitForTimeout(20000);
    if(await errOk(p)){ retries++; if(retries>3) out({error:'repeated failures'}); const box=p.locator('[contenteditable="true"]').first(); await box.click(); await box.fill('Please continue your previous answer from where it stopped.'); await p.keyboard.press('Enter'); continue; }
    const s=await p.evaluate(()=>({stop:!!document.querySelector('[aria-label*="Stop"]'),t:document.body.innerText.slice(-600)+document.body.innerText.length}));
    const idle=!s.stop && !/Lining things up|Gathering details|Thinking…|Working on it/i.test(s.t.slice(-400)); const stable=s.t===prev; prev=s.t; if(idle&&stable) out({done:true,url:p.url(),secs:Math.round((Date.now()-t0)/1000),retries,tail:s.t});}
  out({done:false,timeout:true});}
if(cmd==='read'){const p=await findAsync(a1); const t=await p.evaluate(()=>{[...document.querySelectorAll('button')].filter(b=>/Show more lines/i.test(b.innerText)).forEach(b=>b.click()); return document.body.innerText;});
  const i=t.lastIndexOf('said:'); writeFileSync(a2,t.slice(i)); out({len:t.length-i,file:a2});}
if(cmd==='convs'){const p=await ctx.newPage(); await p.goto(AGENT,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(9000); // fresh tab: open tabs keep a stale sidebar
  const r=await p.evaluate(()=>[...document.querySelectorAll('a[href*="/conversation/"]')].map(a=>({id:a.getAttribute('href').split('/conversation/')[1],text:(a.innerText||'').split('\n')[0].slice(0,60)})));
  await p.close(); out(a1?r.filter(x=>x.text.includes(a1)):r);}

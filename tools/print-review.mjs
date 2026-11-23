// Prints every /proposal combination into one PDF for team review, using the real page.
//   npx serve . --listen 3456     (in another terminal)
//   node tools/print-review.mjs [out.pdf]
// Reads the access code from PROPOSAL_CODE or .proposal-code. Needs Google Chrome (macOS path below).
// The PDF holds the real prices: share it within the team only.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const out = process.argv[2] || 'medulla-proposal-combinations.pdf';
const code = (process.env.PROPOSAL_CODE || (existsSync('.proposal-code') ? readFileSync('.proposal-code', 'utf8') : '')).trim();
if (!code) { console.error('Set PROPOSAL_CODE or create .proposal-code.'); process.exit(1); }
const url = `http://localhost:3456/tools/review-proposals#code=${encodeURIComponent(code)}`;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--disable-gpu', '--remote-debugging-port=9333', '--user-data-dir=/tmp/medulla-review-chrome', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try { target = (await (await fetch('http://127.0.0.1:9333/json')).json()).find((t) => t.type === 'page'); } catch { await sleep(200); }
  }
  if (!target) throw new Error('Chrome did not start');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Page.enable');
  await send('Page.navigate', { url });
  for (let i = 0; i < 120; i++) {
    const r = await send('Runtime.evaluate', { expression: 'window.__done === true', returnByValue: true });
    if (r.result?.result?.value) break;
    await sleep(500);
  }
  const text = await send('Runtime.evaluate', { expression: 'document.body.innerText.slice(0,200)', returnByValue: true });
  if (String(text.result.result.value).startsWith('Review failed')) throw new Error(text.result.result.value);
  const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
  writeFileSync(out, Buffer.from(pdf.result.data, 'base64'));
  console.log(`Wrote ${out}`);
  ws.close();
} finally { chrome.kill(); }

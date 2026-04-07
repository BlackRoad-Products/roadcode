export interface Env { STORE: KVNamespace; DB: D1Database; SERVICE_NAME: string; VERSION: string; }
const SVC = "roadcode";
function json(d: unknown, s = 200) { return new Response(JSON.stringify(d,null,2),{status:s,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","X-BlackRoad-Service":SVC}}); }
async function track(env: Env, req: Request, path: string) { const cf=(req as any).cf||{}; env.DB.prepare("INSERT INTO analytics(subdomain,path,country,ua,ts)VALUES(?,?,?,?,?)").bind(SVC,path,cf.country||"",req.headers.get("User-Agent")?.slice(0,150)||"",Date.now()).run().catch(()=>{}); }

const LANGS = ["typescript","python","javascript","rust","go","bash","sql","yaml","json"];
const SNIPPETS = [
  {title:"G(n) — Amundson Sequence",lang:"typescript",code:`// G(n) = n^(n+1) / (n+1)^n\nfunction G(n: number): number {\n  if (n === 1) return 0.5;\n  return Math.exp((n + 1) * Math.log(n) - n * Math.log(n + 1));\n}\n\n// A_G ≈ 1.2443317839867253741\nconst A_G = 1.2443317839867253741;\n\n// Ramanujan refinement: G(n) ~ n/e + 1/(2e)\nconst asymptotic = (n: number) => n / Math.E + 1 / (2 * Math.E);`},
  {title:"Z-Framework: Z := yx − w",lang:"typescript",code:`// Z = yx - w\n// y = output, x = state, w = target\n// Equilibrium: Z = 0 <=> yx = w\nfunction Z(y: number, x: number, w: number): number {\n  return y * x - w;\n}\n\n// System reaches equilibrium when Z approaches 0\nfunction isEquilibrium(y: number, x: number, w: number, epsilon = 1e-9): boolean {\n  return Math.abs(Z(y, x, w)) < epsilon;\n}`},
  {title:"Pi Fleet Telemetry POST",lang:"bash",code:`#!/bin/bash\n# Post telemetry to BlackRoad\nNODE=\${BR_NODE:-$(hostname)}\nCPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | tr -d '%us,')\nTEMP=$(cat /sys/class/thermal/thermal_zone0/temp | awk '{printf "%.1f",$1/1000}')\n\ncurl -X POST https://telemetry.blackroad.io/ingest \\\n  -H "Content-Type: application/json" \\\n  -d "{\\"node\\":\\"$NODE\\",\\"cpu_pct\\":$CPU,\\"temp_c\\":$TEMP,\\"ts\\":$(date +%s%3N)}"`},
  {title:"Wrangler Deploy Loop",lang:"bash",code:`#!/bin/bash\n# Deploy all BlackRoad services\nfor svc in roadtrip roadie roadview backroad roadcode roadwork \\\n  carkeys roadchain roadcoin roadbook roadworld officeroad \\\n  carpool oneway roadside blackboard highway os; do\n  cd ~/br-services/$svc-v2\n  wrangler deploy 2>&1 | grep -E "Deployed|Error"\n  cd ~/br-services\ndone`},
];

function page(): Response {
  const html=`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><title>RoadCode — BlackRoad IDE</title>
<meta name="description" content="RoadCode — code editor and snippet library for BlackRoad OS.">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#030303;--card:#0a0a0a;--border:#111;--text:#f0f0f0;--sub:#444;--green:#00E676;--grad:linear-gradient(135deg,#00E676,#3E84FF)}
html,body{min-height:100vh;background:var(--bg);color:var(--text);font-family:'Space Grotesk',sans-serif;display:grid;grid-template-columns:280px 1fr;grid-template-rows:auto 1fr}
.grad-bar{height:2px;background:var(--grad);grid-column:1/-1}
.sidebar{border-right:1px solid var(--border);padding:20px;overflow-y:auto;grid-row:2}
.main{padding:20px;grid-row:2;display:flex;flex-direction:column}
h1{font-size:1.1rem;font-weight:700;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.sub{font-size:.65rem;color:var(--sub);font-family:'JetBrains Mono',monospace;margin-bottom:20px}
.ct{font-size:.62rem;color:var(--sub);text-transform:uppercase;letter-spacing:.08em;font-family:'JetBrains Mono',monospace;margin-bottom:8px}
.snippet-item{padding:9px 10px;border:1px solid var(--border);border-radius:6px;cursor:pointer;margin-bottom:5px;transition:border-color .15s}
.snippet-item:hover,.snippet-item.active{border-color:var(--green)}
.snippet-title{font-size:.78rem;font-weight:600}
.snippet-lang{font-size:.62rem;color:var(--sub);font-family:'JetBrains Mono',monospace;margin-top:2px}
.editor-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.editor-title{font-weight:600;font-size:.9rem}
.lang-badge{padding:2px 10px;border-radius:4px;font-size:.65rem;font-family:'JetBrains Mono',monospace;background:#0d0d0d;border:1px solid var(--border);color:var(--green)}
.editor{background:#050505;border:1px solid var(--border);border-radius:8px;padding:16px;flex:1;font-family:'JetBrains Mono',monospace;font-size:.82rem;line-height:1.7;overflow-y:auto;color:#e0e0e0;white-space:pre;tab-size:2;min-height:300px;position:relative}
.actions{display:flex;gap:8px;margin-top:12px}
.btn{padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-size:.78rem;font-weight:600;transition:opacity .15s}
.btn-copy{background:var(--green);color:#000}.btn-save{background:#111;border:1px solid var(--border);color:var(--text)}
.btn:hover{opacity:.85}
.new-form{margin-top:20px;padding-top:16px;border-top:1px solid var(--border)}
.new-form input,.new-form select,.new-form textarea{width:100%;padding:7px 10px;background:#0d0d0d;border:1px solid var(--border);border-radius:5px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:.72rem;outline:none;margin-top:4px;margin-bottom:8px}
.btn-add{width:100%;padding:8px;background:#111;border:1px solid var(--green);border-radius:5px;color:var(--green);cursor:pointer;font-size:.75rem;font-family:'JetBrains Mono',monospace}
@media(max-width:700px){html,body{grid-template-columns:1fr}.sidebar{display:none}}
</style></head><body>
<div class="grad-bar"></div>
<div class="sidebar">
  <h1>RoadCode</h1>
  <div class="sub">roadcode.blackroad.io</div>
  <div class="ct">Snippets</div>
  <div id="snippet-list">
    ${SNIPPETS.map((s,i)=>`<div class="snippet-item${i===0?' active':''}" onclick="load(${i})"><div class="snippet-title">${s.title}</div><div class="snippet-lang">${s.lang}</div></div>`).join("")}
  </div>
  <div class="new-form">
    <div class="ct">Save Snippet</div>
    <input type="text" id="new-title" placeholder="Title">
    <select id="new-lang">${LANGS.map(l=>`<option>${l}</option>`).join("")}</select>
    <button class="btn-add" onclick="saveSnippet()">+ Save Current</button>
  </div>
</div>
<div class="main">
  <div class="editor-header">
    <div class="editor-title" id="editor-title">${SNIPPETS[0].title}</div>
    <div class="lang-badge" id="lang-badge">${SNIPPETS[0].lang}</div>
  </div>
  <div class="editor" id="editor" contenteditable="true">${SNIPPETS[0].code}</div>
  <div class="actions">
    <button class="btn btn-copy" onclick="copy()">Copy</button>
    <button class="btn btn-save" onclick="saveSnippet()">Save</button>
  </div>
</div>
<script src="https://cdn.blackroad.io/br.js"></script>
<script>
var snippets=${JSON.stringify(SNIPPETS)};var activeIdx=0;
function load(i){
  activeIdx=i;var s=snippets[i];
  document.getElementById('editor').textContent=s.code;
  document.getElementById('editor-title').textContent=s.title;
  document.getElementById('lang-badge').textContent=s.lang;
  document.querySelectorAll('.snippet-item').forEach((el,j)=>el.className='snippet-item'+(j===i?' active':''));
}
function copy(){navigator.clipboard.writeText(document.getElementById('editor').textContent).then(()=>{var b=document.querySelector('.btn-copy');b.textContent='Copied!';setTimeout(()=>b.textContent='Copy',2000);});}
async function saveSnippet(){
  var title=document.getElementById('new-title').value||snippets[activeIdx]?.title||'Untitled';
  var lang=document.getElementById('new-lang').value;
  var code=document.getElementById('editor').textContent;
  await fetch('/api/snippets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,lang,code})});
  document.getElementById('new-title').value='';
  alert('Saved!');
}
async function loadSaved(){
  var r=await fetch('/api/snippets');var d=await r.json();
  var list=document.getElementById('snippet-list');
  if(d.snippets?.length){
    d.snippets.forEach(function(s,i){
      var el=document.createElement('div');el.className='snippet-item';
      el.innerHTML='<div class="snippet-title">'+s.title+'</div><div class="snippet-lang">'+s.lang+'</div>';
      el.onclick=function(){document.getElementById('editor').textContent=s.code;document.getElementById('editor-title').textContent=s.title;document.getElementById('lang-badge').textContent=s.lang;document.querySelectorAll('.snippet-item').forEach(x=>x.className='snippet-item');el.className='snippet-item active';};
      list.appendChild(el);
    });
  }
}
loadSaved();
</script>
</body></html>`;
  return new Response(html,{headers:{"Content-Type":"text/html;charset=UTF-8"}});
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*"}});
    const url=new URL(req.url);const path=url.pathname;
    track(env,req,path);
    if(path==="/health")return json({service:SVC,status:"ok",version:env.VERSION,ts:Date.now()});
    if(path==="/api/snippets"&&req.method==="GET"){
      const list=await env.STORE.list({prefix:"snippet:"});
      const snippets=await Promise.all(list.keys.map(async k=>{const v=await env.STORE.get(k.name);return v?JSON.parse(v):null;}));
      return json({snippets:snippets.filter(Boolean)});
    }
    if(path==="/api/snippets"&&req.method==="POST"){
      const b=await req.json() as {title:string;lang:string;code:string};
      const id=crypto.randomUUID();
      await env.STORE.put(`snippet:${id}`,JSON.stringify({id,...b,ts:Date.now()}));
      return json({ok:true,id});
    }
    return page();
  }
};

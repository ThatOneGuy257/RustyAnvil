// Rusty Anvil service worker: works offline, picks up updates when there's signal.
const CACHE='rusty-anvil-dfb7470bce';
const SHELL=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','maskable-512.png','favicon-64.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('rusty-anvil-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms));}
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(req.mode==='navigate'){
    // Always ask GitHub whether the page changed (skips the phone's 10-minute cache), briefly, so updates arrive right away; fall back to the saved copy (field / no signal).
    e.respondWith(Promise.race([fetch(req,{cache:'no-cache'}),timeout(3500)]).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('index.html',cp));return r;})
      .catch(()=>caches.match('index.html').then(r=>r||caches.match('./'))));
    return;
  }
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));return r;}).catch(()=>new Response('',{status:504}))));
    return;
  }
  if(url.origin===location.origin){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));}return r;})));
  }
});

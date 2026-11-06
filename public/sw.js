const V='st-v2';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(['./','index.html','manifest.webmanifest','icon.svg'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.pathname.startsWith('/api/'))return;
 const net=()=>fetch(e.request).then(n=>{if(n.ok){const c=n.clone();caches.open(V).then(ch=>ch.put(e.request,c))}return n});
 e.respondWith(u.origin===location.origin?net().catch(()=>caches.match(e.request)):caches.match(e.request).then(r=>r||net()))});

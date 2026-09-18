const CACHE="st-guitar-chord-board-v1";
const ASSETS=["./","./index.html","./styles.css","./manifest.webmanifest","./src/app.js","./src/chord-core.js","./src/voicing-library.js","./src/audio-adapter.js"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
    const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
  })));
});

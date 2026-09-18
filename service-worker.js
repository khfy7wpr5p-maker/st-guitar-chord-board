const CACHE="st-guitar-chord-board-v8";
const APP_SHELL=["./","./index.html","./styles.css","./manifest.webmanifest","./src/app.js","./src/chord-core.js","./src/chord-labels-tr.js","./src/chord-catalog.js","./src/chord-relations.js","./src/curated-open-voicings.js","./src/voicing-library.js","./src/movable-voicings.js","./src/power-voicings.js","./src/audio-adapter.js","./src/diagram-model.js","./src/authority-baseline.js","./src/local-smplr-guitar-bridge.js","./vendor/audio/source.json"];
const OPTIONAL_LOCAL_AUDIO=["./vendor/audio/electric_guitar_jazz-mp3.js"];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    await Promise.all(OPTIONAL_LOCAL_AUDIO.map(asset=>cache.add(asset).catch(()=>null)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  if(event.request.mode==="navigate"){
    event.respondWith(
      fetch(event.request).catch(()=>caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
      if(!response || response.status!==200 || response.type!=="basic") return response;
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return response;
    }))
  );
});

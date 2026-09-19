const CACHE="st-guitar-chord-board-v24";
const APP_SHELL=["./","./index.html","./styles.css?v=24-1","./manifest.webmanifest","./apple-touch-icon.png","./favicon-16x16.png","./favicon-32x32.png","./favicon.ico","./icon-192.png","./icon-512.png","./maskable-icon-512.png","./src/app.js?v=24-1","./src/tuner.js","./src/tuner-core.js","./src/chord-core.js","./src/chord-labels-tr.js","./src/chord-catalog.js","./src/chord-relations.js","./src/curated-open-voicings.js","./src/voicing-library.js","./src/movable-voicings.js","./src/power-voicings.js","./src/audio-adapter.js","./src/diagram-model.js","./src/selection-state.js","./src/release-config.js","./src/standalone-guitar-audio.js","./vendor/audio/source.json"];
const OPTIONAL_LOCAL_AUDIO=["./vendor/audio/electric_guitar_jazz-mp3.js"];
const RELEASE_REQUIRES_LOCAL_AUDIO=false;
const NETWORK_FIRST_DESTINATIONS=new Set(["script","style"]);

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    if(RELEASE_REQUIRES_LOCAL_AUDIO){
      await cache.addAll(OPTIONAL_LOCAL_AUDIO);
    }else{
      await Promise.all(OPTIONAL_LOCAL_AUDIO.map(asset=>cache.add(asset).catch(()=>null)));
    }
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

  if(NETWORK_FIRST_DESTINATIONS.has(event.request.destination)){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=await fetch(event.request);
        if(response && response.status===200 && response.type==="basic"){
          await cache.put(event.request,response.clone());
        }
        return response;
      }catch{
        return (await cache.match(event.request)) || Response.error();
      }
    })());
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

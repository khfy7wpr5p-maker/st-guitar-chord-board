import test from "node:test";
import assert from "node:assert/strict";
import { createLocalSmplrGuitarBridge, installLocalSmplrGuitarBridge } from "../src/local-smplr-guitar-bridge.js";

test("local smplr bridge declares offline readiness and plays all chord voices", async () => {
  const starts=[];
  const audioContext={state:"suspended",currentTime:4,resumeCalls:0,async resume(){this.resumeCalls+=1;this.state="running";}};
  let receivedUrl=null;
  const bridge=await createLocalSmplrGuitarBridge({
    audioContext,
    createSoundfont({instrumentUrl}) {
      receivedUrl=instrumentUrl;
      return {ready:Promise.resolve(),start(event){starts.push(event);}};
    }
  });

  assert.equal(receivedUrl,"./vendor/audio/electric_guitar_jazz-mp3.js");
  assert.equal(bridge.capabilities.offlineReady,true);
  assert.equal(bridge.capabilities.source,"vendored-local-soundfont");

  const result=await bridge.playChord({midis:[45,52,57],velocity:88,duration:0.7});
  assert.equal(audioContext.resumeCalls,1);
  assert.deepEqual(starts.map(event=>event.note),[45,52,57]);
  assert.deepEqual(starts.map(event=>event.velocity),[88,88,88]);
  assert.ok(starts[1].time>starts[0].time);
  assert.deepEqual(result,{ok:true,voices:3});
});

test("local bridge refuses remote instrument urls", async () => {
  await assert.rejects(
    () => createLocalSmplrGuitarBridge({
      audioContext:{state:"running",currentTime:0,async resume(){}},
      createSoundfont(){ return {start(){}}; },
      instrumentUrl:"https://example.com/guitar.js"
    }),
    /same-origin relative path/
  );
});

test("installer exposes the bridge on the host contract", async () => {
  const host={};
  const bridge=await installLocalSmplrGuitarBridge({
    audioContext:{state:"running",currentTime:0,async resume(){}},
    createSoundfont(){ return {ready:Promise.resolve(),start(){}}; }
  },host);
  assert.equal(host.ST_GUITAR_AUDIO,bridge);
  assert.equal(host.ST_GUITAR_AUDIO.capabilities.offlineReady,true);
});

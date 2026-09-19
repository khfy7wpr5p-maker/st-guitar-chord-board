import test from "node:test";
import assert from "node:assert/strict";

async function loadModule() {
  try {
    return await import("../src/standalone-guitar-audio.js");
  } catch (error) {
    assert.fail(`standalone guitar audio module is required: ${error?.message || error}`);
  }
}

test("standalone guitar audio exposes deterministic MIDI note names", async () => {
  const mod=await loadModule();
  assert.equal(mod.midiToNoteName(40),"E2");
  assert.equal(mod.midiToNoteName(45),"A2");
  assert.equal(mod.midiToNoteName(69),"A4");
  assert.equal(mod.midiToNoteName(42),"Gb2");
  assert.equal(mod.midiToNoteName(44),"Ab2");
  assert.equal(mod.midiToNoteName(46),"Bb2");
  assert.equal(mod.midiToNoteName(49),"Db3");
  assert.equal(mod.midiToNoteName(51),"Eb3");
});

test("standalone installer never replaces an editor-owned guitar bridge", async () => {
  const mod=await loadModule();
  const existing={capabilities:{offlineReady:true},playChord(){}};
  const host={ST_GUITAR_AUDIO:existing};
  const result=mod.installStandaloneGuitarBridge(host);
  assert.equal(result,existing);
  assert.equal(host.ST_GUITAR_AUDIO,existing);
});

test("standalone bridge is local/offline-capable and lazy-loads the instrument once", async () => {
  const mod=await loadModule();
  const starts=[];
  let loads=0;
  const context={
    state:"suspended",
    currentTime:2,
    destination:{},
    async resume(){ this.state="running"; },
    async decodeAudioData(bytes){ return {bytes}; },
    createBufferSource(){
      return {
        buffer:null,
        connect(){},
        start(time){ starts.push(time); }
      };
    },
    createGain(){
      return {
        gain:{value:0},
        connect(){}
      };
    }
  };
  const dataUri="data:audio/mp3;base64,AQID";
  const bridge=mod.createStandaloneGuitarBridge({
    soundfontUrl:"./vendor/audio/electric_guitar_jazz-mp3.js",
    createAudioContext:()=>context,
    loadInstrumentData:async ()=>{
      loads+=1;
      return {E2:dataUri,A2:dataUri,E3:dataUri};
    },
    decodeDataUri:async ()=>new Uint8Array([1,2,3]).buffer
  });

  assert.equal(bridge.capabilities.offlineReady,true);
  assert.equal(bridge.capabilities.source,"standalone-midi-js-soundfont");
  await bridge.playChord({midis:[40,45,52],velocity:0.8});
  await bridge.playChord({midis:[40,45,52]});
  assert.equal(loads,1);
  assert.equal(starts.length,6);
});


test("standalone bridge plays bass-to-treble every 500ms then the full chord for 1s", async () => {
  const mod=await loadModule();
  const starts=[];
  const context={
    state:"running",
    currentTime:10,
    destination:{},
    async decodeAudioData(bytes){ return {bytes}; },
    createBufferSource(){
      return {
        buffer:null,
        connect(){},
        start(...args){ starts.push(args); }
      };
    },
    createGain(){ return { gain:{value:0}, connect(){} }; }
  };
  const dataUri="data:audio/mp3;base64,AQID";
  const bridge=mod.createStandaloneGuitarBridge({
    soundfontUrl:"./vendor/audio/electric_guitar_jazz-mp3.js",
    createAudioContext:()=>context,
    loadInstrumentData:async ()=>({E2:dataUri,A2:dataUri,E3:dataUri}),
    decodeDataUri:async ()=>new Uint8Array([1,2,3]).buffer
  });

  const result=await bridge.playChord({
    midis:[40,45,52],
    playbackMode:"bass-to-treble-then-chord",
    stepMs:500,
    noteDurationMs:500,
    finalChordDurationMs:1000
  });

  assert.equal(result.pattern,"bass-to-treble-then-chord");
  assert.equal(result.totalDurationMs,2500);
  assert.equal(starts.length,6);
  assert.deepEqual(starts.slice(0,3).map(args=>Number(args[0].toFixed(2))),[10.01,10.51,11.01]);
  assert.deepEqual(starts.slice(3).map(args=>Number(args[0].toFixed(2))),[11.51,11.51,11.51]);
  assert.deepEqual(starts.slice(0,3).map(args=>args[2]),[0.5,0.5,0.5]);
  assert.deepEqual(starts.slice(3).map(args=>args[2]),[1,1,1]);
});

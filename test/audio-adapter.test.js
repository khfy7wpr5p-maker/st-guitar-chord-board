import test from "node:test";
import assert from "node:assert/strict";
import { createAudioAdapter } from "../src/audio-adapter.js";

test("editor guitar bridge is preferred when both audio paths exist", async () => {
  const calls=[];
  const adapter=createAudioAdapter({
    ST_GUITAR_AUDIO:{
      playChord(payload){ calls.push(payload); return {ok:true}; }
    },
    ST_SCORE_AUDIO_ENGINE:{
      getInstrumentProfile(){ return {lifecycle:"ACTIVE",sampleReadiness:"QUALIFIED"}; },
      async unlockFromUserGesture(){ throw new Error("must not be called"); },
      async setInstrument(){},
      async audition(){}
    }
  });
  assert.equal(adapter.kind,"host-guitar-audio");
  await adapter.playChord([40,45,52],{symbol:"Am"});
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0].midis,[40,45,52]);
});

test("suspended ST classical guitar profile is not selected", () => {
  const adapter=createAudioAdapter({
    ST_SCORE_AUDIO_ENGINE:{
      getInstrumentProfile(){ return {lifecycle:"SUSPENDED",sampleReadiness:"SUSPENDED"}; },
      async unlockFromUserGesture(){ return {ok:true}; },
      async setInstrument(){},
      async audition(){ return {ok:true}; }
    }
  });
  assert.equal(adapter.kind,"development-web-audio");
});

test("qualified ST Score Audio adapter unlocks guitar and auditions all chord voices", async () => {
  const calls=[];
  const engine={
    getInstrumentProfile(){ return {lifecycle:"ACTIVE",sampleReadiness:"QUALIFIED"}; },
    async unlockFromUserGesture(){ calls.push(["unlock"]); return {ok:true}; },
    async setInstrument(id){ calls.push(["instrument",id]); },
    async audition(request){ calls.push(["audition",request]); return {ok:true,requestId:request.requestId}; }
  };
  const adapter=createAudioAdapter({ST_SCORE_AUDIO_ENGINE:engine,performance:{now:()=>123.4}});
  assert.equal(adapter.kind,"st-score-audio-engine");

  const result=await adapter.playChord([48,52,55,60],{
    symbol:"C",
    voicingIndex:0,
    positions:[
      {stringNumber:5,fret:3},
      {stringNumber:4,fret:2},
      {stringNumber:3,fret:0},
      {stringNumber:2,fret:1}
    ]
  });

  assert.deepEqual(calls[0],["unlock"]);
  assert.deepEqual(calls[1],["instrument","CLASSICAL_GUITAR"]);
  const auditions=calls.filter(([kind])=>kind==="audition").map(([,request])=>request);
  assert.equal(auditions.length,4);
  assert.deepEqual(auditions.map(x=>x.pitch.midi),[48,52,55,60]);
  assert.ok(auditions.every(x=>x.instrumentId==="CLASSICAL_GUITAR"));
  assert.deepEqual(auditions.map(x=>x.stringNumber),[5,4,3,2]);
  assert.deepEqual(auditions.map(x=>x.fret),[3,2,0,1]);
  assert.deepEqual(result,{ok:true,voices:4});
});

test("legacy score-audio hosts without profile inspection remain compatible", () => {
  const engine={
    async unlockFromUserGesture(){ return {ok:true}; },
    async setInstrument(){},
    async audition(){ return {ok:true,requestId:"x"}; }
  };
  assert.equal(createAudioAdapter({ST_SCORE_AUDIO_ENGINE:engine}).kind,"st-score-audio-engine");
});

test("audio adapter surfaces qualified ST audition failures", async () => {
  const engine={
    getInstrumentProfile(){ return {lifecycle:"ACTIVE",sampleReadiness:"QUALIFIED"}; },
    async unlockFromUserGesture(){ return {ok:true}; },
    async setInstrument(){},
    async audition(request){
      return request.pitch.midi===55 ? {ok:false,error:{message:"sample missing"}} : {ok:true,requestId:request.requestId};
    }
  };
  const adapter=createAudioAdapter({ST_SCORE_AUDIO_ENGINE:engine});
  await assert.rejects(()=>adapter.playChord([48,52,55]),/sample missing/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { createAudioAdapter } from "../src/audio-adapter.js";

test("ST Score Audio adapter unlocks guitar and auditions all chord voices", async () => {
  const calls=[];
  const engine={
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

test("audio adapter surfaces ST audition failures", async () => {
  const engine={
    async unlockFromUserGesture(){ return {ok:true}; },
    async setInstrument(){},
    async audition(request){
      return request.pitch.midi===55 ? {ok:false,error:{message:"sample missing"}} : {ok:true,requestId:request.requestId};
    }
  };
  const adapter=createAudioAdapter({ST_SCORE_AUDIO_ENGINE:engine});
  await assert.rejects(()=>adapter.playChord([48,52,55]),/sample missing/);
});

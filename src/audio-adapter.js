const SOURCE_REVISION = "st-guitar-chord-board@0.10.0";

function assertMidiList(midis) {
  if (!Array.isArray(midis) || midis.length < 1 || midis.some(m => !Number.isInteger(m) || m < 0 || m > 127)) {
    throw new TypeError("playChord requires MIDI integers in 0..127");
  }
}

function requestIdFactory(host) {
  let sequence = 0;
  return (symbol, noteIndex) => {
    sequence += 1;
    const now = host.performance?.now?.() ?? Date.now();
    return `chord-board:${symbol || "chord"}:${Math.round(now)}:${sequence}:${noteIndex}`;
  };
}

function editorBridge(host) {
  const bridge = host.ST_GUITAR_AUDIO;
  if (!bridge || typeof bridge.playChord !== "function") return null;
  const declaredOffline = bridge.capabilities?.offlineReady;
  return {
    kind: "host-guitar-audio",
    offlineReady: declaredOffline === true ? true : declaredOffline === false ? false : null,
    playChord(midis, meta = {}) {
      assertMidiList(midis);
      return bridge.playChord({ midis:[...midis], ...meta });
    }
  };
}

function scoreAudioSupportsGuitar(stEngine) {
  if (!stEngine) return false;
  if (
    typeof stEngine.audition !== "function" ||
    typeof stEngine.unlockFromUserGesture !== "function" ||
    typeof stEngine.setInstrument !== "function"
  ) return false;
  if (typeof stEngine.getInstrumentProfile !== "function") return true;
  try {
    const profile = stEngine.getInstrumentProfile("CLASSICAL_GUITAR");
    return profile?.lifecycle === "ACTIVE" && profile?.sampleReadiness === "QUALIFIED";
  } catch {
    return false;
  }
}

function scoreAudioAdapter(host) {
  const stEngine = host.ST_SCORE_AUDIO_ENGINE;
  if (!scoreAudioSupportsGuitar(stEngine)) return null;
  const nextRequestId = requestIdFactory(host);
  return {
    kind: "st-score-audio-engine",
    offlineReady: stEngine.capabilities?.classicalGuitarOfflineReady === true ? true : null,
    async playChord(midis, meta = {}) {
      assertMidiList(midis);
      const unlock = await stEngine.unlockFromUserGesture();
      if (!unlock?.ok) throw new Error(unlock?.error?.message || "Gitar sesi açılamadı");
      await stEngine.setInstrument("CLASSICAL_GUITAR");
      const positions = Array.isArray(meta.positions) ? meta.positions : [];
      const results = await Promise.all(midis.map((midi, noteIndex) => {
        const position = positions[noteIndex] || {};
        return stEngine.audition({
          requestId: nextRequestId(meta.symbol, noteIndex),
          sourceRevisionId: meta.sourceRevisionId || SOURCE_REVISION,
          pitch: { midi },
          instrumentId: "CLASSICAL_GUITAR",
          velocity: meta.velocity ?? 0.82,
          durationMs: meta.durationMs ?? 900,
          ...(Number.isInteger(position.stringNumber) ? { stringNumber: position.stringNumber } : {}),
          ...(Number.isInteger(position.fret) ? { fret: position.fret } : {}),
          sourceEventId: `${meta.symbol || "chord"}:v${(meta.voicingIndex ?? 0) + 1}:n${noteIndex + 1}`
        });
      }));
      const failed = results.find(result => !result?.ok);
      if (failed) throw new Error(failed.error?.message || "Gitar akoru çalınamadı");
      return { ok:true, voices:results.length };
    }
  };
}

function developmentAdapter(host) {
  return {
    kind: "development-web-audio",
    offlineReady: true,
    async playChord(midis, meta = {}) {
      assertMidiList(midis);
      const AudioContextCtor = host.AudioContext || host.webkitAudioContext;
      if (!AudioContextCtor) return { ok:false, reason:"audio-context-unavailable" };
      const ctx = new AudioContextCtor();
      if (ctx.state === "suspended") await ctx.resume();
      const now = ctx.currentTime;
      const scheduleTone=(midi,start,durationMs,velocity=0.12) => {
        const duration=Math.max(0.08,Math.min(5,Number(durationMs || 900)/1000));
        const osc=ctx.createOscillator();
        const gain=ctx.createGain();
        osc.type="triangle";
        osc.frequency.value=440*Math.pow(2,(midi-69)/12);
        gain.gain.setValueAtTime(0.0001,start);
        gain.gain.exponentialRampToValueAtTime(velocity,start+0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001,start+duration);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(start); osc.stop(start+duration+0.05);
      };

      let totalMs=Number(meta.durationMs ?? 900);
      if (meta.playbackMode === "bass-to-treble-then-chord") {
        const stepMs=Math.max(50,Math.min(5000,Number(meta.stepMs ?? 500)));
        const noteDurationMs=Math.max(50,Math.min(5000,Number(meta.noteDurationMs ?? 500)));
        const finalChordDurationMs=Math.max(50,Math.min(5000,Number(meta.finalChordDurationMs ?? 1000)));
        midis.forEach((midi,index)=>scheduleTone(midi,now+(index*stepMs)/1000,noteDurationMs));
        const chordStart=now+(midis.length*stepMs)/1000;
        midis.forEach(midi=>scheduleTone(midi,chordStart,finalChordDurationMs));
        totalMs=midis.length*stepMs+finalChordDurationMs;
      } else {
        midis.forEach((midi,i)=>scheduleTone(midi,now+i*0.002,totalMs));
      }
      setTimeout(()=>ctx.close().catch(()=>{}),Math.ceil(totalMs+200));
      return { ok:true, voices:midis.length };
    }
  };
}

export function createAudioAdapter(host = globalThis) {
  return editorBridge(host) ?? scoreAudioAdapter(host) ?? developmentAdapter(host);
}

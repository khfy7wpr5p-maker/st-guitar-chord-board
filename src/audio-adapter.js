const SOURCE_REVISION = "st-guitar-chord-board@0.3.0";

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

export function createAudioAdapter(host = globalThis) {
  const nextRequestId = requestIdFactory(host);
  const stEngine = host.ST_SCORE_AUDIO_ENGINE;

  if (
    stEngine &&
    typeof stEngine.audition === "function" &&
    typeof stEngine.unlockFromUserGesture === "function" &&
    typeof stEngine.setInstrument === "function"
  ) {
    return {
      kind: "st-score-audio-engine",
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
        return { ok: true, voices: results.length };
      }
    };
  }

  const bridge = host.ST_GUITAR_AUDIO;
  if (bridge && typeof bridge.playChord === "function") {
    return {
      kind: "host-guitar-audio",
      playChord(midis, meta) {
        assertMidiList(midis);
        return bridge.playChord({ midis:[...midis], ...meta });
      }
    };
  }

  return {
    kind: "development-web-audio",
    async playChord(midis) {
      assertMidiList(midis);
      const AudioContextCtor = host.AudioContext || host.webkitAudioContext;
      if (!AudioContextCtor) return { ok:false, reason:"audio-context-unavailable" };
      const ctx = new AudioContextCtor();
      if (ctx.state === "suspended") await ctx.resume();
      const now = ctx.currentTime;
      midis.forEach((midi, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = 440 * Math.pow(2,(midi-69)/12);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.008 + i*0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.9);
      });
      setTimeout(()=>ctx.close().catch(()=>{}),1100);
      return { ok:true, voices:midis.length };
    }
  };
}

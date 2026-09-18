export function createAudioAdapter(host = globalThis) {
  const bridge = host.ST_GUITAR_AUDIO;

  if (bridge && typeof bridge.playChord === "function") {
    return {
      kind: "host-guitar-audio",
      playChord(midis, meta) {
        return bridge.playChord({ midis:[...midis], ...meta });
      }
    };
  }

  return {
    kind: "development-web-audio",
    async playChord(midis) {
      const AudioContextCtor = host.AudioContext || host.webkitAudioContext;
      if (!AudioContextCtor) return;
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
    }
  };
}

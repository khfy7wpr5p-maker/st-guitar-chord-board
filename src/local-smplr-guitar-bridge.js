const DEFAULT_LOCAL_INSTRUMENT_URL = "./vendor/audio/electric_guitar_jazz-mp3.js";

function assertMidiList(midis) {
  if (!Array.isArray(midis) || midis.length < 1 || midis.some(midi => !Number.isInteger(midi) || midi < 0 || midi > 127)) {
    throw new TypeError("playChord requires MIDI integers in 0..127");
  }
}

async function awaitSamplerReady(sampler) {
  if (!sampler || typeof sampler.start !== "function") {
    throw new TypeError("soundfont factory must return a sampler with start()");
  }
  if (sampler.ready && typeof sampler.ready.then === "function") await sampler.ready;
  else if (sampler.load && typeof sampler.load.then === "function") await sampler.load;
  return sampler;
}

export async function createLocalSmplrGuitarBridge({
  audioContext,
  createSoundfont,
  instrumentUrl = DEFAULT_LOCAL_INSTRUMENT_URL,
  duration = 0.9,
  velocity = 92
}) {
  if (!audioContext || typeof audioContext.resume !== "function") {
    throw new TypeError("audioContext with resume() is required");
  }
  if (typeof createSoundfont !== "function") {
    throw new TypeError("createSoundfont callback is required");
  }
  if (typeof instrumentUrl !== "string" || !instrumentUrl.startsWith("./")) {
    throw new TypeError("instrumentUrl must be a same-origin relative path");
  }

  const sampler = await awaitSamplerReady(
    await createSoundfont({ audioContext, instrumentUrl })
  );

  return Object.freeze({
    capabilities: Object.freeze({
      offlineReady: true,
      source: "vendored-local-soundfont",
      instrument: "electric_guitar_jazz",
      instrumentUrl
    }),
    async playChord(payload = {}) {
      const midis = payload.midis;
      assertMidiList(midis);
      if (audioContext.state === "suspended") await audioContext.resume();
      const startTime = Number(audioContext.currentTime || 0) + 0.01;
      const noteDuration = Number(payload.duration ?? duration);
      const noteVelocity = Number(payload.velocity ?? velocity);

      midis.forEach((note, index) => {
        sampler.start({
          note,
          time: startTime + index * 0.004,
          duration: noteDuration,
          velocity: noteVelocity
        });
      });

      return Object.freeze({ ok: true, voices: midis.length });
    }
  });
}

export async function installLocalSmplrGuitarBridge(options = {}, host = globalThis) {
  const bridge = await createLocalSmplrGuitarBridge(options);
  host.ST_GUITAR_AUDIO = bridge;
  return bridge;
}

export { DEFAULT_LOCAL_INSTRUMENT_URL };

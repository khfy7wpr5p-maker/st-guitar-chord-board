const DEFAULT_SOUNDFONT_URL = "./vendor/audio/electric_guitar_jazz-mp3.js";
const INSTRUMENT_ID = "electric_guitar_jazz";
const NOTE_NAMES = Object.freeze(["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"]);

function assertMidi(midi) {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
    throw new RangeError("MIDI note must be an integer in 0..127");
  }
}

function assertMidiList(midis) {
  if (!Array.isArray(midis) || midis.length < 1) {
    throw new TypeError("playChord requires at least one MIDI note");
  }
  midis.forEach(assertMidi);
}

export function midiToNoteName(midi) {
  assertMidi(midi);
  const pitchClass = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${pitchClass}${octave}`;
}

export function decodeBase64DataUri(dataUri, host = globalThis) {
  if (typeof dataUri !== "string" || !dataUri.includes(";base64,")) {
    throw new TypeError("soundfont sample must be a base64 data URI");
  }
  const encoded = dataUri.slice(dataUri.indexOf(",") + 1);
  const decode = host.atob || globalThis.atob;
  if (typeof decode !== "function") throw new Error("base64 decoder unavailable");
  const binary = decode(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function loadMidiJsInstrument(host = globalThis, soundfontUrl = DEFAULT_SOUNDFONT_URL) {
  const existing = host.MIDI?.Soundfont?.[INSTRUMENT_ID];
  if (existing) return Promise.resolve(existing);
  if (!host.document?.createElement) {
    return Promise.reject(new Error("document unavailable for local soundfont loading"));
  }

  host.MIDI ??= {};
  host.MIDI.Soundfont ??= {};

  return new Promise((resolve, reject) => {
    const script = host.document.createElement("script");
    script.src = soundfontUrl;
    script.async = true;
    script.onload = () => {
      const instrument = host.MIDI?.Soundfont?.[INSTRUMENT_ID];
      if (!instrument) {
        reject(new Error("local guitar soundfont loaded without instrument data"));
        return;
      }
      resolve(instrument);
    };
    script.onerror = () => reject(new Error("local guitar soundfont could not be loaded"));
    (host.document.head || host.document.documentElement).appendChild(script);
  });
}

export function createStandaloneGuitarBridge({
  host = globalThis,
  soundfontUrl = DEFAULT_SOUNDFONT_URL,
  createAudioContext,
  loadInstrumentData,
  decodeDataUri
} = {}) {
  if (typeof soundfontUrl !== "string" || !soundfontUrl.startsWith("./")) {
    throw new TypeError("soundfontUrl must be a same-origin relative path");
  }

  const makeContext = createAudioContext || (() => {
    const AudioContextCtor = host.AudioContext || host.webkitAudioContext;
    if (!AudioContextCtor) throw new Error("Web Audio is unavailable");
    return new AudioContextCtor();
  });
  const loadInstrument = loadInstrumentData || (() => loadMidiJsInstrument(host, soundfontUrl));
  const decodeUri = decodeDataUri || (uri => decodeBase64DataUri(uri, host));

  let context = null;
  let instrumentPromise = null;
  const bufferCache = new Map();

  function getContext() {
    context ??= makeContext();
    return context;
  }

  function getInstrument() {
    instrumentPromise ??= Promise.resolve().then(loadInstrument);
    return instrumentPromise;
  }

  async function getBuffer(midi) {
    if (bufferCache.has(midi)) return bufferCache.get(midi);
    const promise = (async () => {
      const instrument = await getInstrument();
      const noteName = midiToNoteName(midi);
      const dataUri = instrument?.[noteName];
      if (!dataUri) throw new Error(`guitar sample missing for ${noteName}`);
      const bytes = await decodeUri(dataUri);
      const ctx = getContext();
      return ctx.decodeAudioData(bytes.slice ? bytes.slice(0) : bytes);
    })();
    bufferCache.set(midi, promise);
    try {
      return await promise;
    } catch (error) {
      bufferCache.delete(midi);
      throw error;
    }
  }

  return Object.freeze({
    capabilities: Object.freeze({
      offlineReady: true,
      source: "standalone-midi-js-soundfont",
      instrument: INSTRUMENT_ID,
      instrumentUrl: soundfontUrl
    }),
    async playChord(payload = {}) {
      const midis = payload.midis;
      assertMidiList(midis);
      const ctx = getContext();
      if (ctx.state === "suspended") await ctx.resume();

      const buffers = await Promise.all(midis.map(getBuffer));
      const velocity = Math.max(0, Math.min(1, Number(payload.velocity ?? 0.82)));
      const startTime = Number(ctx.currentTime || 0) + 0.01;

      buffers.forEach((buffer, index) => {
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        gain.gain.value = velocity;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(startTime + index * 0.004);
      });

      return Object.freeze({ ok:true, voices:midis.length });
    }
  });
}

export function installStandaloneGuitarBridge(host = globalThis, options = {}) {
  if (host.ST_GUITAR_AUDIO && typeof host.ST_GUITAR_AUDIO.playChord === "function") {
    return host.ST_GUITAR_AUDIO;
  }
  const bridge = createStandaloneGuitarBridge({ host, ...options });
  host.ST_GUITAR_AUDIO = bridge;
  return bridge;
}

export { DEFAULT_SOUNDFONT_URL };

export const CHROMATIC_NOTES = Object.freeze(["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"]);

export const TUNER_SIGNAL_DEFAULTS = Object.freeze({
  absoluteRmsFloor: 0.0015,
  initialNoiseFloor: 0.0008,
  noiseMultiplier: 2,
  maxRmsFloor: 0.012,
  holdMs: 800
});

export function signalRms(samples) {
  if (!(samples instanceof Float32Array) && !Array.isArray(samples)) return 0;
  if (!samples.length) return 0;
  let mean=0;
  for (let i=0;i<samples.length;i+=1) mean+=samples[i];
  mean/=samples.length;
  let energy=0;
  for (let i=0;i<samples.length;i+=1) {
    const centered=samples[i]-mean;
    energy+=centered*centered;
  }
  return Math.sqrt(energy/samples.length);
}

export function adaptiveRmsFloor(noiseFloor, {
  absoluteRmsFloor=TUNER_SIGNAL_DEFAULTS.absoluteRmsFloor,
  noiseMultiplier=TUNER_SIGNAL_DEFAULTS.noiseMultiplier,
  maxRmsFloor=TUNER_SIGNAL_DEFAULTS.maxRmsFloor
} = {}) {
  const boundedNoise=Number.isFinite(noiseFloor) && noiseFloor > 0 ? noiseFloor : TUNER_SIGNAL_DEFAULTS.initialNoiseFloor;
  return Math.min(maxRmsFloor,Math.max(absoluteRmsFloor,boundedNoise*noiseMultiplier));
}

export function updateNoiseFloor(currentFloor, observedRms, {
  signalDetected=false,
  minFloor=0.0005,
  maxFloor=0.008,
  riseRate=0.025,
  fallRate=0.12
} = {}) {
  const current=Number.isFinite(currentFloor) && currentFloor > 0 ? currentFloor : TUNER_SIGNAL_DEFAULTS.initialNoiseFloor;
  if (signalDetected || !Number.isFinite(observedRms) || observedRms < 0) {
    return Math.min(maxFloor,Math.max(minFloor,current));
  }
  const target=Math.min(maxFloor,Math.max(minFloor,observedRms));
  const rate=target > current ? riseRate : fallRate;
  return Math.min(maxFloor,Math.max(minFloor,current+(target-current)*rate));
}

export function shouldHoldReading(lastDetectedAt, now, holdMs=TUNER_SIGNAL_DEFAULTS.holdMs) {
  return Number.isFinite(lastDetectedAt)
    && Number.isFinite(now)
    && Number.isFinite(holdMs)
    && holdMs >= 0
    && now >= lastDetectedAt
    && now-lastDetectedAt <= holdMs;
}

export function frequencyToTuning(frequency, referenceHz = 440) {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  if (!Number.isFinite(referenceHz) || referenceHz <= 0) throw new TypeError("referenceHz must be a positive finite number");

  const midiFloat = 69 + 12 * Math.log2(frequency / referenceHz);
  const midi = Math.round(midiFloat);
  const cents = 1200 * Math.log2(frequency / (referenceHz * 2 ** ((midi - 69) / 12)));
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;

  return Object.freeze({
    frequency,
    midi,
    note: CHROMATIC_NOTES[noteIndex],
    noteIndex,
    octave,
    cents
  });
}

export function detectPitchYin(samples, sampleRate, {
  minFrequency = 65,
  maxFrequency = 1760,
  threshold = 0.15,
  rmsFloor = 0.01
} = {}) {
  if (!(samples instanceof Float32Array) && !Array.isArray(samples)) return null;
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) return null;
  const size = samples.length;
  if (size < 64) return null;

  let mean = 0;
  for (let i = 0; i < size; i += 1) mean += samples[i];
  mean /= size;

  const centered = new Float32Array(size);
  let energy = 0;
  for (let i = 0; i < size; i += 1) {
    const value = samples[i] - mean;
    centered[i] = value;
    energy += value * value;
  }
  const rms = Math.sqrt(energy / size);
  if (rms < rmsFloor) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const maxLag = Math.min(Math.floor(size / 2), Math.floor(sampleRate / minFrequency));
  if (maxLag <= minLag) return null;

  const difference = new Float64Array(maxLag + 1);
  for (let lag = 1; lag <= maxLag; lag += 1) {
    let sum = 0;
    const limit = size - lag;
    for (let i = 0; i < limit; i += 1) {
      const delta = centered[i] - centered[i + lag];
      sum += delta * delta;
    }
    difference[lag] = sum;
  }

  const cmnd = new Float64Array(maxLag + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let lag = 1; lag <= maxLag; lag += 1) {
    running += difference[lag];
    cmnd[lag] = running > 0 ? (difference[lag] * lag) / running : 1;
  }

  let lag = minLag;
  while (lag <= maxLag) {
    if (cmnd[lag] < threshold) {
      while (lag + 1 <= maxLag && cmnd[lag + 1] < cmnd[lag]) lag += 1;
      break;
    }
    lag += 1;
  }

  if (lag > maxLag) {
    let bestLag = minLag;
    for (let candidate = minLag + 1; candidate <= maxLag; candidate += 1) {
      if (cmnd[candidate] < cmnd[bestLag]) bestLag = candidate;
    }
    if (cmnd[bestLag] > 0.3) return null;
    lag = bestLag;
  }

  let refinedLag = lag;
  if (lag > 1 && lag < maxLag) {
    const left = cmnd[lag - 1];
    const center = cmnd[lag];
    const right = cmnd[lag + 1];
    const denominator = left - 2 * center + right;
    if (Math.abs(denominator) > 1e-12) {
      refinedLag += 0.5 * (left - right) / denominator;
    }
  }

  const frequency = sampleRate / refinedLag;
  if (!Number.isFinite(frequency) || frequency < minFrequency || frequency > maxFrequency) return null;
  return frequency;
}

export const CHROMATIC_NOTES = Object.freeze(["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"]);

export const TUNER_SIGNAL_DEFAULTS = Object.freeze({
  absoluteRmsFloor: 0.0012,
  initialNoiseFloor: 0.0006,
  noiseMultiplier: 1.8,
  maxRmsFloor: 0.010,
  holdMs: 900
});

export const TUNER_DISPLAY_DEFAULTS = Object.freeze({
  steadyAlpha: 0.34,
  correctionAlpha: 0.62,
  correctionThresholdCents: 7
});

export const TUNER_PRECISION_DEFAULTS = Object.freeze({
  shortWindowSize: 4096,
  longWindowSize: 8192,
  longWindowBelowHz: 150,
  minConfidence: 0.68,
  minPeriodicity: 0.58,
  octaveCorrectionMargin: 0.08,
  agreementCents: 35
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

export function smoothTuningReading(previous, next, {
  steadyAlpha=TUNER_DISPLAY_DEFAULTS.steadyAlpha,
  correctionAlpha=TUNER_DISPLAY_DEFAULTS.correctionAlpha,
  correctionThresholdCents=TUNER_DISPLAY_DEFAULTS.correctionThresholdCents
} = {}) {
  if (!next) return null;
  if (!previous || previous.midi !== next.midi) return Object.freeze({...next});

  const deltaCents=next.cents-previous.cents;
  const alpha=Math.abs(deltaCents) >= correctionThresholdCents ? correctionAlpha : steadyAlpha;
  const boundedAlpha=Math.min(1,Math.max(0,alpha));
  return Object.freeze({
    ...next,
    frequency: previous.frequency + (next.frequency-previous.frequency)*boundedAlpha,
    cents: previous.cents + deltaCents*boundedAlpha
  });
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

function centeredSignal(samples) {
  const size=samples.length;
  let mean=0;
  for (let i=0;i<size;i+=1) mean+=samples[i];
  mean/=size;

  const centered=new Float32Array(size);
  let energy=0;
  for (let i=0;i<size;i+=1) {
    const value=samples[i]-mean;
    centered[i]=value;
    energy+=value*value;
  }
  return {centered,rms:Math.sqrt(energy/size)};
}

function refinedPeriod(values, lag, maxLag) {
  let refined=lag;
  if (lag > 1 && lag < maxLag) {
    const left=values[lag-1];
    const center=values[lag];
    const right=values[lag+1];
    const denominator=left-2*center+right;
    if (Math.abs(denominator) > 1e-12) refined+=0.5*(left-right)/denominator;
  }
  return refined;
}

export function detectPitchYinDetailed(samples, sampleRate, {
  minFrequency=65,
  maxFrequency=1760,
  threshold=0.15,
  rmsFloor=0.01
} = {}) {
  if (!(samples instanceof Float32Array) && !Array.isArray(samples)) return null;
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) return null;
  const size=samples.length;
  if (size < 64) return null;

  const {centered,rms}=centeredSignal(samples);
  if (rms < rmsFloor) return null;

  const minLag=Math.max(2,Math.floor(sampleRate/maxFrequency));
  const maxLag=Math.min(Math.floor(size/2),Math.floor(sampleRate/minFrequency));
  if (maxLag <= minLag) return null;

  const difference=new Float64Array(maxLag+1);
  for (let lag=1;lag<=maxLag;lag+=1) {
    let sum=0;
    const limit=size-lag;
    for (let i=0;i<limit;i+=1) {
      const delta=centered[i]-centered[i+lag];
      sum+=delta*delta;
    }
    difference[lag]=sum;
  }

  const cmnd=new Float64Array(maxLag+1);
  cmnd[0]=1;
  let running=0;
  for (let lag=1;lag<=maxLag;lag+=1) {
    running+=difference[lag];
    cmnd[lag]=running>0 ? (difference[lag]*lag)/running : 1;
  }

  let lag=minLag;
  while (lag<=maxLag) {
    if (cmnd[lag] < threshold) {
      while (lag+1<=maxLag && cmnd[lag+1] < cmnd[lag]) lag+=1;
      break;
    }
    lag+=1;
  }

  if (lag>maxLag) {
    let bestLag=minLag;
    for (let candidate=minLag+1;candidate<=maxLag;candidate+=1) {
      if (cmnd[candidate] < cmnd[bestLag]) bestLag=candidate;
    }
    if (cmnd[bestLag] > 0.3) return null;
    lag=bestLag;
  } else {
    const localStart=Math.max(minLag,Math.floor(lag*0.85));
    const localEnd=Math.min(maxLag,Math.ceil(lag*1.15));
    let localBest=lag;
    for (let candidate=localStart;candidate<=localEnd;candidate+=1) {
      if (cmnd[candidate] < cmnd[localBest]) localBest=candidate;
    }
    lag=localBest;
  }

  const period=refinedPeriod(cmnd,lag,maxLag);
  const frequency=sampleRate/period;
  if (!Number.isFinite(frequency) || frequency<minFrequency || frequency>maxFrequency) return null;

  return Object.freeze({
    frequency,
    period,
    rms,
    yinScore:cmnd[lag],
    confidence:Math.max(0,Math.min(1,1-cmnd[lag]))
  });
}

export function normalizedAutocorrelation(samples, lag) {
  if (!(samples instanceof Float32Array) && !Array.isArray(samples)) return 0;
  const offset=Math.max(1,Math.round(lag));
  if (!Number.isFinite(offset) || offset>=samples.length-2) return 0;

  let mean=0;
  for (let i=0;i<samples.length;i+=1) mean+=samples[i];
  mean/=samples.length;

  let cross=0;
  let energyA=0;
  let energyB=0;
  const limit=samples.length-offset;
  for (let i=0;i<limit;i+=1) {
    const a=samples[i]-mean;
    const b=samples[i+offset]-mean;
    cross+=a*b;
    energyA+=a*a;
    energyB+=b*b;
  }
  const denominator=Math.sqrt(energyA*energyB);
  if (!(denominator>1e-12)) return 0;
  return Math.max(-1,Math.min(1,cross/denominator));
}

function bestPeriodicCorrelation(samples, period) {
  const center=Math.max(1,Math.round(period));
  let best=-1;
  for (const lag of [center-1,center,center+1]) {
    if (lag<1) continue;
    best=Math.max(best,normalizedAutocorrelation(samples,lag));
  }
  return best;
}

export function detectPitchHighPrecision(samples, sampleRate, {
  minFrequency=65,
  maxFrequency=1760,
  threshold=0.18,
  rmsFloor=TUNER_SIGNAL_DEFAULTS.absoluteRmsFloor,
  minConfidence=TUNER_PRECISION_DEFAULTS.minConfidence,
  minPeriodicity=TUNER_PRECISION_DEFAULTS.minPeriodicity,
  octaveCorrectionMargin=TUNER_PRECISION_DEFAULTS.octaveCorrectionMargin
} = {}) {
  const yin=detectPitchYinDetailed(samples,sampleRate,{minFrequency,maxFrequency,threshold,rmsFloor});
  if (!yin) return null;

  let frequency=yin.frequency;
  let period=yin.period;
  let periodicity=bestPeriodicCorrelation(samples,period);

  if (frequency/2>=minFrequency) {
    const lowerPeriod=period*2;
    const lowerPeriodicity=bestPeriodicCorrelation(samples,lowerPeriod);
    if (lowerPeriodicity > periodicity+octaveCorrectionMargin) {
      frequency/=2;
      period=lowerPeriod;
      periodicity=lowerPeriodicity;
    }
  }

  if (frequency*2<=maxFrequency) {
    const upperPeriod=period/2;
    const upperPeriodicity=bestPeriodicCorrelation(samples,upperPeriod);
    if (upperPeriodicity > periodicity+octaveCorrectionMargin*1.5) {
      frequency*=2;
      period=upperPeriod;
      periodicity=upperPeriodicity;
    }
  }

  const periodicity01=Math.max(0,Math.min(1,periodicity));
  const confidence=0.65*yin.confidence+0.35*periodicity01;
  if (periodicity<minPeriodicity || confidence<minConfidence) return null;

  return Object.freeze({frequency,confidence,periodicity,yinConfidence:yin.confidence,rms:yin.rms,period});
}

export function choosePrecisionPitch(shortCandidate, longCandidate, {
  agreementCents=TUNER_PRECISION_DEFAULTS.agreementCents
} = {}) {
  if (!shortCandidate) return longCandidate || null;
  if (!longCandidate) return shortCandidate;

  const distance=Math.abs(1200*Math.log2(longCandidate.frequency/shortCandidate.frequency));
  if (distance<=agreementCents) {
    const total=Math.max(1e-9,shortCandidate.confidence+longCandidate.confidence);
    const logHz=(
      Math.log(shortCandidate.frequency)*shortCandidate.confidence+
      Math.log(longCandidate.frequency)*longCandidate.confidence
    )/total;
    return Object.freeze({...longCandidate,frequency:Math.exp(logHz),confidence:Math.max(shortCandidate.confidence,longCandidate.confidence),consensus:true});
  }

  if (distance>1160 && distance<1240) {
    const lower=shortCandidate.frequency<longCandidate.frequency ? shortCandidate : longCandidate;
    const higher=lower===shortCandidate ? longCandidate : shortCandidate;
    if (lower.confidence+0.08>=higher.confidence) return Object.freeze({...lower,consensus:true,octaveGuard:true});
  }

  const stronger=shortCandidate.confidence>=longCandidate.confidence ? shortCandidate : longCandidate;
  const weaker=stronger===shortCandidate ? longCandidate : shortCandidate;
  if (stronger.confidence-weaker.confidence>=0.12) return stronger;
  return null;
}

export function detectPitchYin(samples, sampleRate, options={}) {
  return detectPitchYinDetailed(samples,sampleRate,options)?.frequency ?? null;
}

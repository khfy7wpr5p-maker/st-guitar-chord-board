import { CHROMATIC_NOTES, detectPitchYin, frequencyToTuning } from "./tuner-core.js";

const UPDATE_INTERVAL_MS = 90;
const IN_TUNE_CENTS = 5;

function stopTracks(stream) {
  for (const track of stream?.getTracks?.() || []) track.stop();
}

function median(values) {
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.floor(sorted.length/2)];
}

function microphoneMessage(error) {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") return "Mikrofon izni verilmedi.";
  if (error?.name === "NotFoundError") return "Mikrofon bulunamadı.";
  return "Tuner başlatılamadı.";
}

export function createChromaticTuner(doc = document, win = window) {
  const panel=doc.querySelector("#tuner-panel");
  const trigger=doc.querySelector("#tuner-button");
  const closeButton=doc.querySelector("#tuner-close");
  const dial=doc.querySelector("#tuner-dial");
  const needle=doc.querySelector("#tuner-needle");
  const noteEl=doc.querySelector("#tuner-note");
  const octaveEl=doc.querySelector("#tuner-octave");
  const frequencyEl=doc.querySelector("#tuner-frequency");
  const centsEl=doc.querySelector("#tuner-cents");
  const statusEl=doc.querySelector("#tuner-status");
  const noteRing=doc.querySelector("#tuner-note-ring");

  if (!panel || !closeButton || !dial || !needle || !noteEl || !octaveEl || !frequencyEl || !centsEl || !statusEl || !noteRing) {
    throw new Error("Tuner UI is incomplete");
  }

  if (!noteRing.children.length) {
    CHROMATIC_NOTES.forEach((note,index) => {
      const label=doc.createElement("span");
      label.className="tuner-clock-note";
      label.dataset.note=note;
      const angle=(index/CHROMATIC_NOTES.length)*Math.PI*2;
      label.style.left=`${50+42*Math.sin(angle)}%`;
      label.style.top=`${50-42*Math.cos(angle)}%`;
      label.textContent=note;
      noteRing.append(label);
    });
  }

  let stream=null;
  let context=null;
  let source=null;
  let analyser=null;
  let frame=0;
  let lastUpdate=0;
  let active=false;
  let history=[];
  const buffer=new Float32Array(2048);

  function setReading(reading) {
    for (const label of noteRing.children) {
      label.classList.toggle("active",Boolean(reading && label.dataset.note === reading.note));
    }

    if (!reading) {
      noteEl.textContent="—";
      octaveEl.textContent="";
      frequencyEl.textContent="— Hz";
      centsEl.textContent="— cent";
      needle.style.setProperty("--needle-angle","0deg");
      dial.dataset.inTune="false";
      return;
    }

    const cents=Math.max(-50,Math.min(50,reading.cents));
    noteEl.textContent=reading.note;
    octaveEl.textContent=String(reading.octave);
    frequencyEl.textContent=`${reading.frequency.toFixed(1)} Hz`;
    centsEl.textContent=`${reading.cents > 0 ? "+" : ""}${Math.round(reading.cents)} cent`;
    needle.style.setProperty("--needle-angle",`${(cents * 1.2).toFixed(2)}deg`);
    dial.dataset.inTune=String(Math.abs(reading.cents) <= IN_TUNE_CENTS);
  }

  function stopAudio() {
    active=false;
    if (frame) win.cancelAnimationFrame(frame);
    frame=0;
    try { source?.disconnect(); } catch {}
    try { analyser?.disconnect(); } catch {}
    stopTracks(stream);
    stream=null;
    source=null;
    analyser=null;
    history=[];
    if (context) {
      const closing=context;
      context=null;
      closing.close().catch(()=>{});
    }
  }

  function close() {
    stopAudio();
    panel.hidden=true;
    panel.setAttribute("aria-hidden","true");
    trigger?.setAttribute("aria-expanded","false");
    setReading(null);
    statusEl.textContent="";
  }

  async function startAudio() {
    const mediaDevices=win.navigator?.mediaDevices;
    const AudioContextCtor=win.AudioContext || win.webkitAudioContext;
    if (!mediaDevices?.getUserMedia || !AudioContextCtor) {
      statusEl.textContent="Bu tarayıcı mikrofon tunerini desteklemiyor.";
      return;
    }

    statusEl.textContent="Mikrofon izni bekleniyor…";
    try {
      stream=await mediaDevices.getUserMedia({
        audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},
        video:false
      });
      if (!active) {
        stopTracks(stream);
        stream=null;
        return;
      }

      context=new AudioContextCtor();
      await context.resume();
      source=context.createMediaStreamSource(stream);
      analyser=context.createAnalyser();
      analyser.fftSize=2048;
      analyser.smoothingTimeConstant=0;
      source.connect(analyser);
      statusEl.textContent="Dinleniyor";

      const tick=(now) => {
        if (!active || !analyser || !context) return;
        if (now-lastUpdate >= UPDATE_INTERVAL_MS) {
          lastUpdate=now;
          analyser.getFloatTimeDomainData(buffer);
          const detected=detectPitchYin(buffer,context.sampleRate);
          if (detected) {
            history.push(detected);
            if (history.length > 3) history.shift();
            const frequency=median(history);
            setReading(frequencyToTuning(frequency));
            statusEl.textContent="Dinleniyor";
          } else {
            history=[];
            setReading(null);
            statusEl.textContent="Bir nota çalın";
          }
        }
        frame=win.requestAnimationFrame(tick);
      };
      frame=win.requestAnimationFrame(tick);
    } catch (error) {
      stopAudio();
      statusEl.textContent=microphoneMessage(error);
    }
  }

  async function open() {
    if (!panel.hidden && active) return;
    panel.hidden=false;
    panel.setAttribute("aria-hidden","false");
    trigger?.setAttribute("aria-expanded","true");
    active=true;
    setReading(null);
    await startAudio();
  }

  closeButton.addEventListener("click",close);
  panel.addEventListener("click",event => {
    if (event.target === panel) close();
  });
  doc.addEventListener("keydown",event => {
    if (event.key === "Escape" && !panel.hidden) close();
  });
  win.addEventListener("pagehide",stopAudio);

  return Object.freeze({ open, close, stop:stopAudio });
}

function assertVoicing(voicing) {
  if (!voicing || !Array.isArray(voicing.frets) || voicing.frets.length !== 6) {
    throw new TypeError("voicing.frets must contain six strings");
  }
  if (!Array.isArray(voicing.fingers) || voicing.fingers.length !== 6) {
    throw new TypeError("voicing.fingers must contain six strings");
  }
}

export function buildChordDiagramModel(voicing, visibleFrets = 5) {
  assertVoicing(voicing);
  if (!Number.isInteger(visibleFrets) || visibleFrets < 4 || visibleFrets > 7) {
    throw new RangeError("visibleFrets must be an integer in 4..7");
  }

  const hasOpenString = voicing.frets.some(fret => fret === 0);
  const positive = voicing.frets.filter(fret => fret > 0);
  const baseFret = !hasOpenString && positive.length && Math.min(...positive) > 1 ? Math.min(...positive) : 1;

  const strings = voicing.frets.map((fret, index) => {
    const finger = voicing.fingers[index];
    const stringNumber = 6 - index;
    if (fret < 0) return { stringNumber, state:"muted", fret:-1, finger:null, row:null };
    if (fret === 0) return { stringNumber, state:"open", fret:0, finger:null, row:null };
    const row = fret - baseFret + 1;
    if (row < 1 || row > visibleFrets) {
      throw new RangeError(`voicing fret ${fret} falls outside visible diagram window`);
    }
    return { stringNumber, state:"fretted", fret, finger:finger > 0 ? finger : null, row };
  });

  const barres = (voicing.barres || []).flatMap(barre => {
    const row = barre.fret - baseFret + 1;
    if (row < 1 || row > visibleFrets) return [];
    return [{
      finger:barre.finger,
      fret:barre.fret,
      row,
      fromString:barre.fromString,
      toString:barre.toString
    }];
  });

  return { baseFret, visibleFrets, strings, barres };
}

const X0=45, X1=315, TOP=60, BOTTOM=310;
const STRING_STROKE_WIDTHS=Object.freeze({
  6:4.8,
  5:4.1,
  4:3.4,
  3:2.8,
  2:2.2,
  1:1.8
});

function xForString(stringNumber) {
  return X0 + ((6 - stringNumber) * (X1 - X0) / 5);
}

function yForRow(row, visibleFrets) {
  const fretHeight=(BOTTOM-TOP)/visibleFrets;
  return TOP + (row - 0.5) * fretHeight;
}

function diagramAriaLabel(model) {
  return model.baseFret===1
    ? "Gitar akor diyagramı, açık pozisyon"
    : `Gitar akor diyagramı, ${model.baseFret}. perdeden`;
}

export function renderChordDiagramSvg(voicing) {
  const model=buildChordDiagramModel(voicing);
  const fretHeight=(BOTTOM-TOP)/model.visibleFrets;
  const vertical=model.strings.map(s =>
    `<line class="string-line string-${s.stringNumber}" data-string="${s.stringNumber}" x1="${xForString(s.stringNumber)}" y1="${TOP}" x2="${xForString(s.stringNumber)}" y2="${BOTTOM}" stroke-width="${STRING_STROKE_WIDTHS[s.stringNumber]}" />`
  ).join("");
  const horizontal=Array.from({length:model.visibleFrets+1},(_,i)=>{
    const y=TOP+i*fretHeight;
    const isNut=i===0&&model.baseFret===1;
    const width=isNut?8:2.6;
    const classes=isNut?"fret-line nut-line":"fret-line";
    return `<line class="${classes}" data-fret-line="${i}" x1="${X0}" y1="${y}" x2="${X1}" y2="${y}" stroke-width="${width}" />`;
  }).join("");

  const status=model.strings.map(s=>{
    const x=xForString(s.stringNumber);
    if(s.state==="open") return `<circle cx="${x}" cy="30" r="9" class="open-mark" data-string="${s.stringNumber}"/>`;
    if(s.state==="muted") return `<text x="${x}" y="37" class="mute-mark" data-string="${s.stringNumber}">×</text>`;
    return "";
  }).join("");

  const barres=model.barres.map(b=>{
    const xA=xForString(b.fromString);
    const xB=xForString(b.toString);
    const left=Math.min(xA,xB)-17;
    const width=Math.abs(xB-xA)+34;
    const y=yForRow(b.row,model.visibleFrets)-17;
    return `<rect x="${left}" y="${y}" width="${width}" height="34" rx="17" class="barre-mark" data-finger="${b.finger ?? ""}" />`;
  }).join("");

  const notes=model.strings.filter(s=>s.state==="fretted").map(s=>{
    const x=xForString(s.stringNumber);
    const y=yForRow(s.row,model.visibleFrets);
    const label=s.finger ?? "";
    return `<g class="finger-position" data-string="${s.stringNumber}" data-fret="${s.fret}"><circle cx="${x}" cy="${y}" r="17" class="finger-mark"/><text x="${x}" y="${y+6}" class="finger-number">${label}</text></g>`;
  }).join("");

  const base=model.baseFret>1
    ? `<text x="19" y="${yForRow(1,model.visibleFrets)+6}" class="base-fret">${model.baseFret}</text>`
    : "";

  return `<svg class="chord-diagram" viewBox="0 0 360 340" role="img" focusable="false" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" data-base-fret="${model.baseFret}" aria-label="${diagramAriaLabel(model)}">
    <g class="fretboard-lines">${vertical}${horizontal}</g>
    <g class="string-status">${status}</g>
    ${base}${barres}${notes}
  </svg>`;
}

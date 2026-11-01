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

const X0=66, X1=294, TOP=46, BOTTOM=428;
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

function materialDefinitions(model) {
  const stringGradients=model.strings.map(s=>{
    const x=xForString(s.stringNumber);
    const radius=STRING_STROKE_WIDTHS[s.stringNumber]/2;
    const colors=s.stringNumber>=4
      ? ["#725031","#dfbc86","#fff2ce","#986e40"]
      : ["#757e80","#d9dfe0","#ffffff","#969fa2"];
    return `<linearGradient id="st-string-${s.stringNumber}" gradientUnits="userSpaceOnUse" x1="${x-radius}" y1="0" x2="${x+radius}" y2="0"><stop stop-color="${colors[0]}"/><stop offset=".38" stop-color="${colors[1]}"/><stop offset=".57" stop-color="${colors[2]}"/><stop offset="1" stop-color="${colors[3]}"/></linearGradient>`;
  }).join("");
  const fretGradients=Array.from({length:model.visibleFrets+1},(_,i)=>{
    const y=TOP+i*(BOTTOM-TOP)/model.visibleFrets;
    return `<linearGradient id="st-fret-${i}" gradientUnits="userSpaceOnUse" x1="0" y1="${y-3}" x2="0" y2="${y+3}"><stop stop-color="#656a65"/><stop offset=".28" stop-color="#f9f7ed"/><stop offset=".48" stop-color="#ffffff"/><stop offset=".72" stop-color="#b0b2a8"/><stop offset="1" stop-color="#555b56"/></linearGradient>`;
  }).join("");
  return `<defs>
    <linearGradient id="st-neck-edge" x2="1" y2="0"><stop stop-color="#4b2c18"/><stop offset=".06" stop-color="#b58651"/><stop offset=".12" stop-color="#644126"/><stop offset=".88" stop-color="#513721"/><stop offset=".96" stop-color="#bd945f"/><stop offset="1" stop-color="#53331d"/></linearGradient>
    <linearGradient id="st-dark-wood" x2="1" y2="0"><stop stop-color="#363831"/><stop offset=".13" stop-color="#1d211e"/><stop offset=".5" stop-color="#30322b"/><stop offset=".85" stop-color="#181d19"/><stop offset="1" stop-color="#33372e"/></linearGradient>
    <linearGradient id="st-ivory" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#fffdf5"/><stop offset=".45" stop-color="#f8efd9"/><stop offset="1" stop-color="#d3bd94"/></linearGradient>
    <pattern id="st-wood-grain" width="41" height="164" patternUnits="userSpaceOnUse"><path d="M4 0Q1 43 5 82T4 164M18 0Q23 52 18 82T18 164M31 0Q27 57 31 82T31 164" fill="none" stroke="#b8b499" stroke-opacity=".13" stroke-width=".7"/><path d="M9 0Q13 43 9 82T9 164M35 0Q39 43 35 82T35 164" fill="none" stroke="#070c09" stroke-opacity=".4" stroke-width="1.2"/></pattern>
    <filter id="st-neck-shadow" x="-25%" y="-10%" width="155%" height="125%"><feDropShadow dx="7" dy="8" stdDeviation="5" flood-color="#362b1d" flood-opacity=".25"/></filter>
    <filter id="st-marker-shadow" x="-30%" y="-50%" width="160%" height="210%"><feDropShadow dx="1" dy="3" stdDeviation="1.6" flood-color="#000" flood-opacity=".5"/></filter>
    ${stringGradients}${fretGradients}
  </defs>`;
}

export function renderChordDiagramSvg(voicing) {
  const model=buildChordDiagramModel(voicing);
  const fretHeight=(BOTTOM-TOP)/model.visibleFrets;
  const vertical=model.strings.map(s => {
    const x=xForString(s.stringNumber);
    const width=STRING_STROKE_WIDTHS[s.stringNumber];
    const winding=s.stringNumber>=4
      ? `<line class="string-winding" x1="${x}" y1="${TOP}" x2="${x}" y2="${BOTTOM}" stroke-width="${width}"/>`
      : "";
    return `<line class="string-shadow" x1="${x+1}" y1="${TOP}" x2="${x+1}" y2="${BOTTOM}" stroke-width="${width+1}"/><line class="string-line string-${s.stringNumber}" data-string="${s.stringNumber}" x1="${x}" y1="${TOP}" x2="${x}" y2="${BOTTOM}" stroke-width="${width}" stroke="url(#st-string-${s.stringNumber})"/>${winding}`;
  }).join("");
  const horizontal=Array.from({length:model.visibleFrets+1},(_,i)=>{
    const y=TOP+i*fretHeight;
    const isNut=i===0&&model.baseFret===1;
    const width=isNut?8:5.4;
    const classes=isNut?"fret-line nut-line":"fret-line";
    const left=56-i*8/model.visibleFrets;
    const nut=isNut?`<rect class="nut-body" x="48" y="38" width="264" height="17" rx="7" fill="url(#st-ivory)"/>`:"";
    return `${nut}<line class="fret-shadow" x1="${left}" y1="${y+2}" x2="${360-left}" y2="${y+2}"/><line class="${classes}" data-fret-line="${i}" x1="${left}" y1="${y}" x2="${360-left}" y2="${y}" stroke-width="${width}" stroke="url(#st-fret-${i})"/>`;
  }).join("");

  const status=model.strings.map(s=>{
    const x=xForString(s.stringNumber);
    if(s.state==="open") return `<circle cx="${x}" cy="17" r="8" class="open-mark" data-string="${s.stringNumber}"/>`;
    if(s.state==="muted") return `<text x="${x}" y="25" class="mute-mark" data-string="${s.stringNumber}">×</text>`;
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

  const fretNumbers=Array.from({length:model.visibleFrets},(_,i)=>
    `<text x="26" y="${yForRow(i+1,model.visibleFrets)+6}" class="${model.baseFret>1&&i===0?"base-fret ":""}fret-number">${model.baseFret+i}</text>`
  ).join("");
  const stringNumbers=model.strings.map(s=>
    `<text x="${xForString(s.stringNumber)}" y="462" class="string-number">${s.stringNumber}</text>`
  ).join("");

  return `<svg class="chord-diagram" viewBox="0 0 360 480" role="img" focusable="false" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" data-base-fret="${model.baseFret}" aria-label="${diagramAriaLabel(model)}">
    ${materialDefinitions(model)}
    <g class="neck-surface" filter="url(#st-neck-shadow)"><path d="M49 46Q49 36 59 36H301Q311 36 311 46L320 439H40Z" fill="url(#st-neck-edge)"/><path d="M58 46H302L309 434H51Z" fill="url(#st-dark-wood)"/><path d="M58 46H302L309 434H51Z" fill="url(#st-wood-grain)"/></g>
    <g class="fretboard-lines">${horizontal}${vertical}</g>
    <g class="string-status">${status}</g>
    <g class="fret-numbers">${fretNumbers}</g>
    <g class="finger-markers">${barres}${notes}</g>
    <g class="string-numbers">${stringNumbers}</g>
  </svg>`;
}

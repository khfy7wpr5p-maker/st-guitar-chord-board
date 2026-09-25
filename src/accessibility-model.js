function assertVoicing(voicing) {
  if (!voicing || !Array.isArray(voicing.frets) || voicing.frets.length !== 6) {
    throw new TypeError("voicing.frets must contain six strings");
  }
  if (!Array.isArray(voicing.fingers) || voicing.fingers.length !== 6) {
    throw new TypeError("voicing.fingers must contain six strings");
  }
}

function buildStringEntry(fret, finger, index) {
  const stringNumber=6-index;
  if (fret < 0) {
    return Object.freeze({
      stringNumber,
      state:"muted",
      fret:-1,
      finger:null,
      text:`${stringNumber}. tel çalınmaz`
    });
  }
  if (fret === 0) {
    return Object.freeze({
      stringNumber,
      state:"open",
      fret:0,
      finger:null,
      text:`${stringNumber}. tel açık`
    });
  }

  const normalizedFinger=Number.isInteger(finger) && finger > 0 ? finger : null;
  return Object.freeze({
    stringNumber,
    state:"fretted",
    fret,
    finger:normalizedFinger,
    text:normalizedFinger === null
      ? `${stringNumber}. tel, ${fret}. perde`
      : `${stringNumber}. tel, ${fret}. perde, ${normalizedFinger}. parmak`
  });
}

function buildBarreEntry(barre) {
  const finger=Number.isInteger(barre?.finger) && barre.finger > 0 ? barre.finger : null;
  const fret=barre?.fret;
  const fromString=barre?.fromString;
  const toString=barre?.toString;
  const fingerPrefix=finger === null ? "" : `${finger}. parmakla `;
  return Object.freeze({
    finger,
    fret,
    fromString,
    toString,
    text:`${fingerPrefix}${fret}. perdede ${fromString}. telden ${toString}. tele bare`
  });
}

export function buildChordAccessibilityModel({
  symbol,
  chordName,
  voicing,
  position,
  totalPositions
}) {
  assertVoicing(voicing);

  const strings=Object.freeze(
    voicing.frets.map((fret,index)=>buildStringEntry(fret,voicing.fingers[index],index))
  );
  const barres=Object.freeze((voicing.barres || []).map(buildBarreEntry));
  const phrases=[
    ...strings.map(entry=>entry.text),
    ...barres.map(entry=>entry.text),
    "Akoru çalmak için çift dokunun"
  ];

  return Object.freeze({
    label:`${symbol}, ${chordName}, pozisyon ${position} / ${totalPositions}`,
    strings,
    barres,
    description:`${phrases.join(". ")}.`
  });
}

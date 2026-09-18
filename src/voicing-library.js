import { parseChordQuery } from "./chord-core.js";
import { getCommonOpenVoicing } from "./curated-open-voicings.js";
import { generateMovableVoicings } from "./movable-voicings.js";
import { generatePowerVoicings } from "./power-voicings.js";

const V = (frets, fingers, barres = [], shape = "curated") => ({ frets, fingers, barres, shape, generated:false });

export const C_FAMILY_VOICINGS = Object.freeze({
  C: [
    V([-1,3,2,0,1,0],[-1,3,2,0,1,0],[],"open"),
    V([-1,3,5,5,5,3],[-1,1,3,3,3,1],[{finger:1,fret:3,fromString:5,toString:1},{finger:3,fret:5,fromString:4,toString:2}],"A"),
    V([8,10,10,9,8,8],[1,3,4,2,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"E")
  ],
  Cm: [
    V([-1,3,1,0,1,3],[-1,3,1,0,2,4],[],"open"),
    V([-1,3,5,5,4,3],[-1,1,3,4,2,1],[{finger:1,fret:3,fromString:5,toString:1}],"Am"),
    V([8,10,10,8,8,8],[1,3,4,1,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"Em")
  ],
  C7: [
    V([-1,3,2,3,5,3],[-1,2,1,3,4,3],[{finger:3,fret:3,fromString:3,toString:1}],"complete-open-region"),
    V([-1,3,5,3,5,3],[-1,1,3,1,4,1],[{finger:1,fret:3,fromString:5,toString:1}],"A7"),
    V([8,10,8,9,8,8],[1,3,1,2,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"E7")
  ],
  Cmaj7: [
    V([-1,3,2,0,0,0],[-1,3,2,0,0,0],[],"open"),
    V([-1,3,5,4,5,3],[-1,1,3,2,4,1],[{finger:1,fret:3,fromString:5,toString:1}],"Amaj7"),
    V([8,10,9,9,8,8],[1,4,2,3,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"Emaj7")
  ],
  Cm7: [
    V([-1,3,1,3,1,3],[-1,2,1,3,1,4],[{finger:1,fret:1,fromString:4,toString:2}],"open-region"),
    V([-1,3,5,3,4,3],[-1,1,3,1,2,1],[{finger:1,fret:3,fromString:5,toString:1}],"Am7"),
    V([8,10,8,8,8,8],[1,3,1,1,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"Em7")
  ],
  Csus2: [
    V([-1,3,0,0,1,3],[-1,2,0,0,1,4],[],"open"),
    V([-1,3,5,5,3,3],[-1,1,3,4,1,1],[{finger:1,fret:3,fromString:5,toString:1}],"Asus2"),
    V([8,10,10,7,8,8],[2,4,4,1,3,3],[{finger:4,fret:10,fromString:5,toString:4},{finger:3,fret:8,fromString:2,toString:1}],"Esus2")
  ],
  Csus4: [
    V([-1,3,3,0,1,1],[-1,3,4,0,1,1],[{finger:1,fret:1,fromString:2,toString:1}],"open"),
    V([-1,3,5,5,6,3],[-1,1,3,3,4,1],[{finger:1,fret:3,fromString:5,toString:1},{finger:3,fret:5,fromString:4,toString:3}],"Asus4"),
    V([8,10,10,10,8,8],[1,3,4,4,1,1],[{finger:1,fret:8,fromString:6,toString:1},{finger:4,fret:10,fromString:4,toString:3}],"Esus4")
  ]
});

function voicingKey(voicing) {
  return voicing.frets.join(",");
}

function combineUnique(primary, generated) {
  const result=[];
  const seen=new Set();
  for (const voicing of [...primary,...generated]) {
    const key=voicingKey(voicing);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(voicing);
  }
  return result;
}

export function getVoicings(symbol) {
  if (C_FAMILY_VOICINGS[symbol]) return C_FAMILY_VOICINGS[symbol];
  const chord = parseChordQuery(symbol);
  if (!chord) return [];
  if (chord.quality === "5") return generatePowerVoicings(chord);
  const generated = generateMovableVoicings(chord);
  const open = getCommonOpenVoicing(symbol);
  return combineUnique(open ? [open] : [], generated);
}

const OPEN_MIDI = [40,45,50,55,59,64];
export function voicingMidi(voicing) {
  return voicing.frets.flatMap((fret,index) => fret < 0 ? [] : [OPEN_MIDI[index] + fret]);
}

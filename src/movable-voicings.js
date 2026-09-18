import { ROOT_PCS } from "./chord-core.js";

const T = (frets, fingers, barres = [], shape = "movable") => ({ frets, fingers, barres, shape });

const BASE = Object.freeze({
  major: [
    T([-1,3,5,5,5,3],[-1,1,3,3,3,1],[{finger:1,fret:3,fromString:5,toString:1},{finger:3,fret:5,fromString:4,toString:2}],"A"),
    T([8,10,10,9,8,8],[1,3,4,2,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"E"),
    T([-1,-1,10,12,13,12],[-1,-1,1,2,4,3],[],"D")
  ],
  m: [
    T([-1,3,5,5,4,3],[-1,1,3,4,2,1],[{finger:1,fret:3,fromString:5,toString:1}],"Am"),
    T([8,10,10,8,8,8],[1,3,4,1,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"Em"),
    T([-1,-1,10,12,13,11],[-1,-1,1,3,4,2],[],"Dm")
  ],
  "7": [
    T([-1,3,5,3,5,3],[-1,1,3,1,4,1],[{finger:1,fret:3,fromString:5,toString:1}],"A7"),
    T([8,10,8,9,8,8],[1,3,1,2,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"E7"),
    T([-1,-1,10,12,11,12],[-1,-1,1,3,2,4],[],"D7")
  ],
  maj7: [
    T([-1,3,5,4,5,3],[-1,1,3,2,4,1],[{finger:1,fret:3,fromString:5,toString:1}],"Amaj7"),
    T([8,10,9,9,8,8],[1,4,2,3,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"Emaj7"),
    T([-1,-1,10,12,12,12],[-1,-1,1,3,3,3],[{finger:3,fret:12,fromString:3,toString:1}],"Dmaj7")
  ],
  m7: [
    T([-1,3,5,3,4,3],[-1,1,3,1,2,1],[{finger:1,fret:3,fromString:5,toString:1}],"Am7"),
    T([8,10,8,8,8,8],[1,3,1,1,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"Em7"),
    T([-1,-1,10,12,11,11],[-1,-1,1,3,2,2],[{finger:2,fret:11,fromString:2,toString:1}],"Dm7")
  ],
  sus2: [
    T([-1,3,5,5,3,3],[-1,1,3,4,1,1],[{finger:1,fret:3,fromString:5,toString:1}],"Asus2"),
    T([8,10,10,7,8,8],[2,4,4,1,3,3],[{finger:4,fret:10,fromString:5,toString:4},{finger:3,fret:8,fromString:2,toString:1}],"Esus2"),
    T([-1,-1,10,12,13,10],[-1,-1,1,3,4,1],[{finger:1,fret:10,fromString:4,toString:1}],"Dsus2")
  ],
  sus4: [
    T([-1,3,5,5,6,3],[-1,1,3,3,4,1],[{finger:1,fret:3,fromString:5,toString:1},{finger:3,fret:5,fromString:4,toString:3}],"Asus4"),
    T([8,10,10,10,8,8],[1,3,4,4,1,1],[{finger:1,fret:8,fromString:6,toString:1},{finger:4,fret:10,fromString:4,toString:3}],"Esus4"),
    T([-1,-1,10,12,13,13],[-1,-1,1,2,3,4],[],"Dsus4")
  ]
});

function shiftedTemplate(template, semitones) {
  const shifted = template.frets.map(f => f < 0 ? -1 : f + semitones);
  const positive = shifted.filter(f => f >= 0);
  let octaveShift = 0;
  if (Math.max(...positive) > 20 && Math.min(...positive) >= 12) octaveShift = -12;
  const frets = shifted.map(f => f < 0 ? -1 : f + octaveShift);
  const barres = template.barres.map(b => ({...b, fret:b.fret + semitones + octaveShift}));
  if (frets.some(f => f > 20)) throw new Error("Generated voicing exceeds fret 20");
  if (frets.some(f => f < -1)) throw new Error("Generated voicing has invalid fret");
  return {...template, frets, barres, generated:true};
}

export function generateMovableVoicings(chord) {
  if (!chord || !(chord.root in ROOT_PCS)) return [];
  const templates = BASE[chord.quality];
  if (!templates) return [];
  return templates.map(t => shiftedTemplate(t, ROOT_PCS[chord.root]));
}

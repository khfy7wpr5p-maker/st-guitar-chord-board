import { ROOT_PCS } from "./chord-core.js";

const T = (frets, fingers, barres = [], shape = "movable") => ({ frets, fingers, barres, shape });
const MAX_FRET = 20;

const BASE = Object.freeze({
  major: [
    T([-1,3,5,5,5,3],[-1,1,2,3,4,1],[{finger:1,fret:3,fromString:5,toString:1}],"A"),
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
    T([-1,-1,10,12,12,12],[-1,-1,1,2,3,4],[],"Dmaj7")
  ],
  m7: [
    T([-1,3,5,3,4,3],[-1,1,3,1,2,1],[{finger:1,fret:3,fromString:5,toString:1}],"Am7"),
    T([8,10,8,8,8,8],[1,3,1,1,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"Em7"),
    T([-1,-1,10,12,11,11],[-1,-1,1,4,2,3],[],"Dm7")
  ],
  sus2: [
    T([-1,3,5,5,3,3],[-1,1,3,4,1,1],[{finger:1,fret:3,fromString:5,toString:1}],"Asus2"),
    T([8,10,10,7,-1,-1],[2,3,4,1,-1,-1],[],"Esus2"),
    T([-1,-1,10,12,13,10],[-1,-1,1,3,4,1],[{finger:1,fret:10,fromString:4,toString:1}],"Dsus2")
  ],
  sus4: [
    T([-1,3,5,5,6,3],[-1,1,2,3,4,1],[{finger:1,fret:3,fromString:5,toString:1}],"Asus4"),
    T([8,10,10,10,8,8],[1,2,3,4,1,1],[{finger:1,fret:8,fromString:6,toString:1}],"Esus4"),
    T([-1,-1,10,12,13,13],[-1,-1,1,2,3,4],[],"Dsus4")
  ]
});

function mod12(value) {
  return ((value % 12) + 12) % 12;
}

function placementDeltas(template, targetRootPc) {
  const played=template.frets.filter(fret=>fret>=0);
  if (!played.length) return [];
  const minDelta=-Math.min(...played);
  const maxDelta=MAX_FRET-Math.max(...played);
  const deltas=[];
  for (let delta=minDelta; delta<=maxDelta; delta+=1) {
    if (mod12(delta)===targetRootPc) deltas.push(delta);
  }
  return deltas;
}

function shiftedTemplate(template, semitones) {
  const frets=template.frets.map(fret=>{
    if (fret<0) return -1;
    const shifted=fret+semitones;
    if (shifted<0 || shifted>MAX_FRET) {
      throw new Error("Generated voicing exceeds bounded fret range");
    }
    return shifted;
  });

  const fingers=template.fingers.map((finger,index)=>{
    if (frets[index]<0) return -1;
    if (frets[index]===0) return 0;
    return finger;
  });

  const barres=template.barres.flatMap(barre=>{
    const fret=barre.fret+semitones;
    if (fret<0 || fret>MAX_FRET) {
      throw new Error("Generated barre exceeds bounded fret range");
    }
    if (fret===0) return [];
    return [{...barre,fret}];
  });

  return {...template,frets,fingers,barres,generated:true};
}

export function generateMovableVoicings(chord) {
  if (!chord || !(chord.root in ROOT_PCS)) return [];
  const templates=BASE[chord.quality];
  if (!templates) return [];
  const rootPc=ROOT_PCS[chord.root];
  return templates.flatMap(template=>
    placementDeltas(template,rootPc).map(delta=>shiftedTemplate(template,delta))
  );
}

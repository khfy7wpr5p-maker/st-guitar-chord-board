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
  ],
  dim: [
    T([-1,3,1,-1,4,2],[-1,3,1,-1,4,2],[],"Adim"),
    T([8,9,10,8,-1,-1],[1,2,3,1,-1,-1],[{finger:1,fret:8,fromString:6,toString:3}],"Edim"),
    T([8,6,10,-1,7,-1],[3,1,4,-1,2,-1],[],"dim-compact")
  ],
  aug: [
    T([-1,3,2,1,1,-1],[-1,3,2,1,1,-1],[{finger:1,fret:1,fromString:3,toString:2}],"Aaug"),
    T([8,7,6,-1,-1,8],[3,2,1,-1,-1,4],[],"Eaug"),
    T([-1,-1,10,9,9,12],[-1,-1,2,1,1,3],[{finger:1,fret:9,fromString:3,toString:2}],"Daug")
  ],
  "6": [
    T([-1,3,2,2,-1,3],[-1,2,1,1,-1,3],[{finger:1,fret:2,fromString:4,toString:3}],"A6"),
    T([8,7,7,-1,8,-1],[2,1,1,-1,3,-1],[{finger:1,fret:7,fromString:5,toString:4}],"E6"),
    T([-1,-1,10,12,10,12],[-1,-1,1,2,1,3],[{finger:1,fret:10,fromString:4,toString:2}],"D6")
  ],
  m6: [
    T([-1,3,1,2,-1,3],[-1,3,1,2,-1,4],[],"Am6"),
    T([8,6,7,-1,8,-1],[3,1,2,-1,4,-1],[],"Em6"),
    T([-1,-1,10,12,10,11],[-1,-1,1,3,1,2],[{finger:1,fret:10,fromString:4,toString:2}],"Dm6")
  ],
  "9": [
    T([8,7,8,7,8,-1],[2,1,3,1,4,-1],[{finger:1,fret:7,fromString:5,toString:3}],"E9-a"),
    T([8,10,8,9,-1,10],[1,3,1,2,-1,4],[{finger:1,fret:8,fromString:6,toString:4}],"E9-b"),
    T([8,10,8,9,8,10],[1,3,1,2,1,4],[{finger:1,fret:8,fromString:6,toString:2}],"E9-c")
  ],
  add9: [
    T([8,10,-1,9,-1,10],[1,3,-1,2,-1,4],[],"Eadd9-a"),
    T([-1,-1,10,9,8,10],[-1,-1,3,2,1,4],[],"Dadd9"),
    T([8,7,-1,-1,8,10],[2,1,-1,-1,3,4],[],"Eadd9-b")
  ],
  m7b5: [
    T([-1,3,4,3,4,-1],[-1,1,2,1,3,-1],[{finger:1,fret:3,fromString:5,toString:3}],"Am7b5"),
    T([8,9,8,8,-1,-1],[1,2,1,1,-1,-1],[{finger:1,fret:8,fromString:6,toString:3}],"Em7b5-a"),
    T([8,9,8,-1,-1,11],[1,2,1,-1,-1,3],[{finger:1,fret:8,fromString:6,toString:4}],"Em7b5-b")
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

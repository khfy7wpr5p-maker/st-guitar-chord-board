const V = (frets, fingers, barres = []) => ({ frets, fingers, barres });

export const C_FAMILY_VOICINGS = Object.freeze({
  C: [
    V([-1,3,2,0,1,0],[-1,3,2,0,1,0]),
    V([-1,3,5,5,5,3],[-1,1,3,3,3,1],[{finger:1,fret:3,fromString:5,toString:1},{finger:3,fret:5,fromString:4,toString:2}]),
    V([8,10,10,9,8,8],[1,3,4,2,1,1],[{finger:1,fret:8,fromString:6,toString:1}])
  ],
  Cm: [
    V([-1,3,1,0,1,3],[-1,3,1,0,2,4]),
    V([-1,3,5,5,4,3],[-1,1,3,4,2,1],[{finger:1,fret:3,fromString:5,toString:1}]),
    V([8,10,10,8,8,8],[1,3,4,1,1,1],[{finger:1,fret:8,fromString:6,toString:1}])
  ],
  C7: [
    V([-1,3,2,3,1,0],[-1,3,2,4,1,0]),
    V([-1,3,5,3,5,3],[-1,1,3,1,4,1],[{finger:1,fret:3,fromString:5,toString:1}]),
    V([8,10,8,9,8,8],[1,3,1,2,1,1],[{finger:1,fret:8,fromString:6,toString:1}])
  ],
  Cmaj7: [
    V([-1,3,2,0,0,0],[-1,3,2,0,0,0]),
    V([-1,3,5,4,5,3],[-1,1,3,2,4,1],[{finger:1,fret:3,fromString:5,toString:1}]),
    V([8,10,9,9,8,8],[1,4,2,3,1,1],[{finger:1,fret:8,fromString:6,toString:1}])
  ],
  Cm7: [
    V([-1,3,1,3,1,3],[-1,3,1,4,1,4]),
    V([-1,3,5,3,4,3],[-1,1,3,1,2,1],[{finger:1,fret:3,fromString:5,toString:1}]),
    V([8,10,8,8,8,8],[1,3,1,1,1,1],[{finger:1,fret:8,fromString:6,toString:1}])
  ],
  Csus2: [
    V([-1,3,0,0,1,3],[-1,2,0,0,1,4]),
    V([-1,3,5,5,3,3],[-1,1,3,4,1,1],[{finger:1,fret:3,fromString:5,toString:1}]),
    V([8,10,10,7,8,8],[2,4,4,1,2,2])
  ],
  Csus4: [
    V([-1,3,3,0,1,1],[-1,3,4,0,1,1],[{finger:1,fret:1,fromString:2,toString:1}]),
    V([-1,3,5,5,6,3],[-1,1,3,3,4,1],[{finger:1,fret:3,fromString:5,toString:1}]),
    V([8,10,10,10,8,8],[1,3,4,4,1,1],[{finger:1,fret:8,fromString:6,toString:1}])
  ]
});

export function getVoicings(symbol) {
  return C_FAMILY_VOICINGS[symbol] ?? [];
}

const OPEN_MIDI = [40,45,50,55,59,64]; // string 6 -> 1
export function voicingMidi(voicing) {
  return voicing.frets.flatMap((fret,index) => fret < 0 ? [] : [OPEN_MIDI[index] + fret]);
}

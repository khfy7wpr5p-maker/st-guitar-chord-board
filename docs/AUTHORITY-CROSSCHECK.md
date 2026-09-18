# Authority cross-check

The Chord Board remains a standalone offline product, but its musical/physical assumptions are pinned to reviewed ST source repositories.

## Fretboard authority

Source: `khfy7wpr5p-maker/musicxml-to-guitar-tab-engine`  
Reviewed main commit: `1d8ced644f544f7e991f7275eda77a2ce557774e`

Pinned facts:

- six strings;
- standard tuning: E2/A2/D3/G3/B3/E4;
- MIDI: 40/45/50/55/59/64;
- bounded fret range: 0..20;
- fret semantics: relative from capo;
- position MIDI = open-string MIDI + capo + relative fret.

The current Chord Board has no capo control, so the cross-check uses capo 0.

## Harmonic authority

Source: `khfy7wpr5p-maker/st-guitar-harmonic-engine`  
Reviewed main commit: `f631ec8c30df616b9d83d9269e56278742878d32`

Exact templates cross-checked:

- major: 0,4,7
- minor: 0,3,7
- dominant seventh: 0,4,7,10
- major seventh: 0,4,7,11
- minor seventh: 0,3,7,10

Suspended evidence cross-checked:

- sus2: 0,2,7
- sus4: 0,5,7

The Chord Board keeps its small product vocabulary; it does not import the larger harmonic resolver into the phone runtime.

## Fingering authority

Source: `khfy7wpr5p-maker/st-guitar-fingering-training`  
Reviewed main commit: `06564c494c15acc7a1a2ec20219854d234281cf9`

The deterministic boundary remains authoritative. The Stage 7 cross-check mirrors the frozen S1-H-B resource rule relevant to this product:

- open strings do not consume a left-hand fretting finger;
- equal-fret targets may share a continuous barre unless a required open or lower-fret string blocks it;
- five or more required fretting groups is outside standard four-finger feasibility.

The learned GuitarSet ranker remains research-only. The source repository explicitly records:

- `runtime_connection_authorized=false`
- `production_authorized=false`

Chord Board therefore does not connect that learned ranker.

## CI gate

For all 84 chord identities and every displayed voicing, CI now verifies:

1. local interval vocabulary equals the pinned harmonic templates;
2. string/fret -> MIDI output round-trips against the pinned standard tuning;
3. fret values remain in the authoritative 0..20 board;
4. deterministic fingering resource demand is at most four groups;
5. learned ranking remains outside runtime authority.

This is a compatibility guard, not a vendored copy of the source engines. When an authority repository changes deliberately, its pinned revision and corresponding product tests must be reviewed together.

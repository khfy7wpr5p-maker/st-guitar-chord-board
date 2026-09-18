# Third-party notices

## FluidR3_GM — Electric Guitar (Jazz)

The optional vendored guitar soundfont is sourced from:

- repository: `gleitz/midi-js-soundfonts`
- pinned commit: `044fab8e1456bfafc5776e86dfd6bb8697149aef`
- source file: `FluidR3_GM/electric_guitar_jazz-mp3.js`
- pinned Git blob: `2c0ef6f12d5a260982520130c97905e5931a60d4`

The source repository README identifies FluidR3_GM-derived soundfont assets as **Creative Commons Attribution 3.0**. Preserve appropriate attribution when distributing a build that includes the vendored sample asset.

The `midi-js-soundfonts` repository's software/package license file is MIT and credits Benjamin Gleitzman. The sample-license statement above is separate from the repository software license.

The large generated audio asset is intentionally not committed to this repository. It is downloaded from the pinned source revision during an explicit build/vendor step and its Git blob hash is verified before use.

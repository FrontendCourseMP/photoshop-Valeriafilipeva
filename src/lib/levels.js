export function buildLUT(black, white, gamma) {
  const lut = new Uint8Array(256);
  const range = white - black;
  for (let i = 0; i < 256; i++) {
    if (range === 0) { lut[i] = 0; continue; }
    let v = (i - black) / range;
    v = Math.max(0, Math.min(1, v));
    v = Math.pow(v, 1 / gamma);
    lut[i] = Math.round(v * 255);
  }
  return lut;
}

export function applyLUT(imageData, lut, channel) {
  const { width, height, data } = imageData;
  const out = new ImageData(new Uint8ClampedArray(data), width, height);
  const d = out.data;
  const len = width * height;
  if (channel === 'master') {
    for (let i = 0; i < len; i++) {
      const idx = i * 4;
      d[idx]   = lut[d[idx]];
      d[idx+1] = lut[d[idx+1]];
      d[idx+2] = lut[d[idx+2]];
    }
  } else if (channel === 'R') {
    for (let i = 0; i < len; i++) { const idx = i*4; d[idx] = lut[d[idx]]; }
  } else if (channel === 'G') {
    for (let i = 0; i < len; i++) { const idx = i*4; d[idx+1] = lut[d[idx+1]]; }
  } else if (channel === 'B') {
    for (let i = 0; i < len; i++) { const idx = i*4; d[idx+2] = lut[d[idx+2]]; }
  } else if (channel === 'A') {
    for (let i = 0; i < len; i++) { const idx = i*4; d[idx+3] = lut[d[idx+3]]; }
  }
  return out;
}

export function applyAllLevels(imageData, levelsState) {
  let result = imageData;
  for (const ch of ['master', 'R', 'G', 'B', 'A']) {
    const s = levelsState[ch];
    if (!s) continue;
    if (s.black === 0 && s.white === 255 && s.gamma === 1.0) continue;
    result = applyLUT(result, buildLUT(s.black, s.white, s.gamma), ch);
  }
  return result;
}

export function calcHistogram(imageData, channel) {
  const { width, height, data } = imageData;
  const hist = new Uint32Array(256);
  const len = width * height;
  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    if (channel === 'master') {
      hist[Math.round(0.299*data[idx] + 0.587*data[idx+1] + 0.114*data[idx+2])]++;
    } else if (channel === 'R') { hist[data[idx]]++;
    } else if (channel === 'G') { hist[data[idx+1]]++;
    } else if (channel === 'B') { hist[data[idx+2]]++;
    } else if (channel === 'A') { hist[data[idx+3]]++;
    }
  }
  return hist;
}

export function defaultLevelState() {
  return { black: 0, white: 255, gamma: 1.0 };
}

export function defaultLevelsAll() {
  return {
    master: defaultLevelState(),
    R: defaultLevelState(),
    G: defaultLevelState(),
    B: defaultLevelState(),
    A: defaultLevelState(),
  };
}
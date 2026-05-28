// Градационные преобразования — LUT и гистограмма

// Строит таблицу подстановки (LUT) для градационной коррекции
// black: 0-254, white: 1-255, gamma: 0.1-9.9
export function buildLUT(black, white, gamma) {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let v = (i - black) / (white - black);
    v = Math.max(0, Math.min(1, v));
    // Гамма-коррекция средних тонов
    v = Math.pow(v, 1 / gamma);
    lut[i] = Math.round(v * 255);
  }
  return lut;
}

// Применяет LUT к одному каналу или ко всем RGB сразу
// channel: 'master' | 'R' | 'G' | 'B' | 'A'
export function applyLUT(imageData, lut, channel) {
  const { width, height, data } = imageData;
  const out = new ImageData(
    new Uint8ClampedArray(data),
    width,
    height
  );
  const d = out.data;

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    if (channel === 'master') {
      d[idx]   = lut[d[idx]];
      d[idx+1] = lut[d[idx+1]];
      d[idx+2] = lut[d[idx+2]];
      // alpha не трогаем
    } else if (channel === 'R') {
      d[idx] = lut[d[idx]];
    } else if (channel === 'G') {
      d[idx+1] = lut[d[idx+1]];
    } else if (channel === 'B') {
      d[idx+2] = lut[d[idx+2]];
    } else if (channel === 'A') {
      d[idx+3] = lut[d[idx+3]];
    }
  }
  return out;
}

// Применяет все каналы последовательно (master + отдельные)
export function applyAllLevels(imageData, levelsState) {
  let result = imageData;
  const channels = ['master', 'R', 'G', 'B', 'A'];
  for (const ch of channels) {
    const s = levelsState[ch];
    if (!s) continue;
    // Пропускаем если значения дефолтные
    if (s.black === 0 && s.white === 255 && s.gamma === 1.0) continue;
    const lut = buildLUT(s.black, s.white, s.gamma);
    result = applyLUT(result, lut, ch);
  }
  return result;
}

// Вычисляет гистограмму для заданного канала
// channel: 'master' | 'R' | 'G' | 'B' | 'A'
// Возвращает Uint32Array[256] — количество пикселей каждого значения
export function calcHistogram(imageData, channel) {
  const { width, height, data } = imageData;
  const hist = new Uint32Array(256);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];

    if (channel === 'master') {
      // Яркость по формуле luminance
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      hist[lum]++;
    } else if (channel === 'R') {
      hist[r]++;
    } else if (channel === 'G') {
      hist[g]++;
    } else if (channel === 'B') {
      hist[b]++;
    } else if (channel === 'A') {
      hist[a]++;
    }
  }
  return hist;
}

// Дефолтное состояние уровней для одного канала
export function defaultLevelState() {
  return { black: 0, white: 255, gamma: 1.0 };
}

// Дефолтное состояние для всех каналов
export function defaultLevelsAll() {
  return {
    master: defaultLevelState(),
    R: defaultLevelState(),
    G: defaultLevelState(),
    B: defaultLevelState(),
    A: defaultLevelState(),
  };
}
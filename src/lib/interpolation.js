// Методы двумерной интерполяции для масштабирования изображений

// Единый интерфейс: (ImageData, newWidth, newHeight) → ImageData
// Это позволяет легко добавлять новые методы

export function nearestNeighbor(imageData, dw, dh) {
  const { width: sw, height: sh, data: src } = imageData;
  const out = new ImageData(dw, dh);
  const dst = out.data;

  const xRatio = sw / dw;
  const yRatio = sh / dh;

  for (let y = 0; y < dh; y++) {
    const srcY = Math.min(Math.floor(y * yRatio), sh - 1);
    for (let x = 0; x < dw; x++) {
      const srcX = Math.min(Math.floor(x * xRatio), sw - 1);
      const srcIdx = (srcY * sw + srcX) * 4;
      const dstIdx = (y  * dw + x)  * 4;
      dst[dstIdx]   = src[srcIdx];
      dst[dstIdx+1] = src[srcIdx+1];
      dst[dstIdx+2] = src[srcIdx+2];
      dst[dstIdx+3] = src[srcIdx+3];
    }
  }
  return out;
}

export function bilinear(imageData, dw, dh) {
  const { width: sw, height: sh, data: src } = imageData;
  const out = new ImageData(dw, dh);
  const dst = out.data;

  const xRatio = sw / dw;
  const yRatio = sh / dh;

  for (let y = 0; y < dh; y++) {
    const gy  = y * yRatio;
    const y0  = Math.min(Math.floor(gy), sh - 1);
    const y1  = Math.min(y0 + 1, sh - 1);
    const yFrac = gy - y0;

    for (let x = 0; x < dw; x++) {
      const gx   = x * xRatio;
      const x0   = Math.min(Math.floor(gx), sw - 1);
      const x1   = Math.min(x0 + 1, sw - 1);
      const xFrac = gx - x0;

      // Четыре соседних пикселя
      const i00 = (y0 * sw + x0) * 4;
      const i10 = (y0 * sw + x1) * 4;
      const i01 = (y1 * sw + x0) * 4;
      const i11 = (y1 * sw + x1) * 4;

      const dstIdx = (y * dw + x) * 4;

      for (let c = 0; c < 4; c++) {
        // Билинейная интерполяция по x, потом по y
        const top    = src[i00+c] * (1 - xFrac) + src[i10+c] * xFrac;
        const bottom = src[i01+c] * (1 - xFrac) + src[i11+c] * xFrac;
        dst[dstIdx+c] = Math.round(top * (1 - yFrac) + bottom * yFrac);
      }
    }
  }
  return out;
}

// Реестр методов — легко добавить новые
export const INTERPOLATION_METHODS = {
  bilinear: {
    label: 'Билинейная',
    tooltip: 'Плавный результат, подходит для большинства изображений. Усредняет 4 соседних пикселя.',
    fn: bilinear,
  },
  nearest: {
    label: 'Ближайший сосед',
    tooltip: 'Быстрый метод без вычислений. Сохраняет чёткие пиксели, подходит для пиксель-арта.',
    fn: nearestNeighbor,
  },
};

// Главная функция масштабирования
export function resizeImage(imageData, dw, dh, method = 'bilinear') {
  const m = INTERPOLATION_METHODS[method];
  if (!m) return bilinear(imageData, dw, dh);
  return m.fn(imageData, dw, dh);
}
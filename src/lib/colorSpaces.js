// RGB → CIELAB конвертация

function linearize(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function rgbToXyz(r, g, b) {
  const rl = linearize(r);
  const gl = linearize(g);
  const bl = linearize(b);
  return {
    x: rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375,
    y: rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750,
    z: rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041,
  };
}

function xyzToLab(x, y, z) {
  const xn = 0.95047, yn = 1.00000, zn = 1.08883;
  const f = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(x / xn), fy = f(y / yn), fz = f(z / zn);
  return {
    L: Math.round((116 * fy - 16) * 10) / 10,
    a: Math.round((500 * (fx - fy)) * 10) / 10,
    b: Math.round((200 * (fy - fz)) * 10) / 10,
  };
}

export function rgbToLab(r, g, b) {
  const { x, y, z } = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

export function applyChannels(imageData, enabled) {
  const { width, height, data } = imageData;
  const out = new ImageData(width, height);
  const d = out.data;
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    d[idx]   = enabled.R ? data[idx]   : 0;
    d[idx+1] = enabled.G ? data[idx+1] : 0;
    d[idx+2] = enabled.B ? data[idx+2] : 0;
    d[idx+3] = enabled.A ? data[idx+3] : 255;
  }
  return out;
}

// Создаёт миниатюру БЫСТРО:
// 1. Сначала масштабируем через drawImage (браузер делает это быстро)
// 2. Потом применяем канал только к маленькому изображению (80×80 пикселей)
export function makeChannelThumb(imageData, channel, thumbSize = 80) {
  const { width, height } = imageData;
  const scale = Math.min(thumbSize / width, thumbSize / height);
  const tw = Math.max(1, Math.round(width  * scale));
  const th = Math.max(1, Math.round(height * scale));

  // Шаг 1: рисуем оригинал и сразу масштабируем до thumbSize
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = width; srcCanvas.height = height;
  srcCanvas.getContext('2d').putImageData(imageData, 0, 0);

  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = tw; smallCanvas.height = th;
  const smallCtx = smallCanvas.getContext('2d');
  smallCtx.drawImage(srcCanvas, 0, 0, tw, th); // браузер масштабирует быстро

  // Шаг 2: применяем канал только к маленьким пикселям (tw*th штук, не width*height)
  const small = smallCtx.getImageData(0, 0, tw, th);
  const d = small.data;

  for (let i = 0; i < tw * th; i++) {
    const idx = i * 4;
    const r = d[idx], g = d[idx+1], b = d[idx+2], a = d[idx+3];
    if (channel === 'R') {
      d[idx]=r; d[idx+1]=0; d[idx+2]=0; d[idx+3]=255;
    } else if (channel === 'G') {
      d[idx]=0; d[idx+1]=g; d[idx+2]=0; d[idx+3]=255;
    } else if (channel === 'B') {
      d[idx]=0; d[idx+1]=0; d[idx+2]=b; d[idx+3]=255;
    } else if (channel === 'A') {
      d[idx]=a; d[idx+1]=a; d[idx+2]=a; d[idx+3]=255;
    }
  }

  smallCtx.putImageData(small, 0, 0);
  return smallCanvas.toDataURL();
}

// Генерирует все 4 миниатюры по одной с паузами между ними
// onThumb(channel, dataUrl) вызывается когда каждая готова
export function makeChannelThumbsAsync(imageData, onThumb) {
  const channels = ['R', 'G', 'B', 'A'];

  // Сначала масштабируем оригинал один раз — переиспользуем для всех каналов
  const { width, height } = imageData;
  const thumbSize = 80;
  const scale = Math.min(thumbSize / width, thumbSize / height);
  const tw = Math.max(1, Math.round(width  * scale));
  const th = Math.max(1, Math.round(height * scale));

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = width; srcCanvas.height = height;
  srcCanvas.getContext('2d').putImageData(imageData, 0, 0);

  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = tw; smallCanvas.height = th;
  smallCanvas.getContext('2d').drawImage(srcCanvas, 0, 0, tw, th);

  // Читаем пиксели маленького изображения один раз
  const smallData = smallCanvas.getContext('2d').getImageData(0, 0, tw, th);

  // Генерируем каналы по одному с паузой в 1 кадр между ними
  let i = 0;
  function processNext() {
    if (i >= channels.length) return;
    const ch = channels[i++];

    // Копируем маленькие данные и применяем канал
    const out = new ImageData(new Uint8ClampedArray(smallData.data), tw, th);
    const d = out.data;
    for (let j = 0; j < tw * th; j++) {
      const idx = j * 4;
      const r = d[idx], g = d[idx+1], b = d[idx+2], a = d[idx+3];
      if (ch === 'R') { d[idx]=r; d[idx+1]=0; d[idx+2]=0; d[idx+3]=255; }
      else if (ch === 'G') { d[idx]=0; d[idx+1]=g; d[idx+2]=0; d[idx+3]=255; }
      else if (ch === 'B') { d[idx]=0; d[idx+1]=0; d[idx+2]=b; d[idx+3]=255; }
      else if (ch === 'A') { d[idx]=a; d[idx+1]=a; d[idx+2]=a; d[idx+3]=255; }
    }

    const c = document.createElement('canvas');
    c.width = tw; c.height = th;
    c.getContext('2d').putImageData(out, 0, 0);
    onThumb(ch, c.toDataURL());

    // Следующий канал через 1 кадр — не блокируем UI
    requestAnimationFrame(processNext);
  }

  requestAnimationFrame(processNext);
}
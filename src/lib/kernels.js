// Предустановленные ядра свёртки 3×3

export const PRESETS = {
  identity: {
    label: 'Тождественное отображение',
    kernel: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    divisor: 1,
  },
  sharpen: {
    label: 'Повышение резкости',
    kernel: [
      [ 0, -1,  0],
      [-1,  5, -1],
      [ 0, -1,  0],
    ],
    divisor: 1,
  },
  gaussian: {
    label: 'Фильтр Гаусса (3×3)',
    kernel: [
      [1, 2, 1],
      [2, 4, 2],
      [1, 2, 1],
    ],
    divisor: 16,
  },
  box_blur: {
    label: 'Прямоугольное размытие',
    kernel: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
    divisor: 9,
  },
  prewitt_x: {
    label: 'Прюитт — горизонтальный',
    kernel: [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ],
    divisor: 1,
  },
  prewitt_y: {
    label: 'Прюитт — вертикальный',
    kernel: [
      [-1, -1, -1],
      [ 0,  0,  0],
      [ 1,  1,  1],
    ],
    divisor: 1,
  },
};

// Стратегии заполнения края
export const PADDING_STRATEGIES = {
  black: 'Заполнение чёрным',
  white: 'Заполнение белым',
  copy:  'Копирование края',
};

// Получает значение пикселя с учётом стратегии края
function getPixel(data, w, h, x, y, strategy) {
  if (x >= 0 && x < w && y >= 0 && y < h) {
    const idx = (y * w + x) * 4;
    return [data[idx], data[idx+1], data[idx+2], data[idx+3]];
  }
  if (strategy === 'black') return [0, 0, 0, 255];
  if (strategy === 'white') return [255, 255, 255, 255];
  // copy — зажимаем координаты
  const cx = Math.max(0, Math.min(w - 1, x));
  const cy = Math.max(0, Math.min(h - 1, y));
  const idx = (cy * w + cx) * 4;
  return [data[idx], data[idx+1], data[idx+2], data[idx+3]];
}

// Применяет свёртку к одному каналу (0=R,1=G,2=B,3=A)
// kernel — плоский массив 9 элементов, divisor — делитель
export function applyKernelToChannel(
  srcData, width, height,
  kernelFlat, divisor,
  channelIdx,
  padding
) {
  const dst = new Uint8ClampedArray(srcData);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;

      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const px = x + kx - 1;
          const py = y + ky - 1;
          const pixel = getPixel(srcData, width, height, px, py, padding);
          sum += pixel[channelIdx] * kernelFlat[ky * 3 + kx];
        }
      }

      const dstIdx = (y * width + x) * 4 + channelIdx;
      dst[dstIdx] = Math.max(0, Math.min(255, Math.round(sum / divisor)));
    }
  }
  return dst;
}

// Применяет свёртку к выбранным каналам
// channels: массив из 'R','G','B','A'
export function applyConvolution(imageData, kernelFlat, divisor, channels, padding) {
  const { width, height, data } = imageData;
  let result = new Uint8ClampedArray(data);

  const channelMap = { R: 0, G: 1, B: 2, A: 3 };

  for (const ch of channels) {
    const idx = channelMap[ch];
    if (idx === undefined) continue;
    result = applyKernelToChannel(result, width, height, kernelFlat, divisor, idx, padding);
  }

  return new ImageData(result, width, height);
}
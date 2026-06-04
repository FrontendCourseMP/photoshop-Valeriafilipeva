// Web Worker для свёртки — не блокирует UI

function getPixel(data, w, h, x, y, strategy) {
  if (x >= 0 && x < w && y >= 0 && y < h) {
    const idx = (y * w + x) * 4;
    return [data[idx], data[idx+1], data[idx+2], data[idx+3]];
  }
  if (strategy === 'black') return [0, 0, 0, 255];
  if (strategy === 'white') return [255, 255, 255, 255];
  const cx = Math.max(0, Math.min(w - 1, x));
  const cy = Math.max(0, Math.min(h - 1, y));
  const idx = (cy * w + cx) * 4;
  return [data[idx], data[idx+1], data[idx+2], data[idx+3]];
}

function applyKernelToChannel(srcData, width, height, kernelFlat, divisor, channelIdx, padding) {
  const dst = new Uint8ClampedArray(srcData);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const pixel = getPixel(srcData, width, height, x + kx - 1, y + ky - 1, padding);
          sum += pixel[channelIdx] * kernelFlat[ky * 3 + kx];
        }
      }
      dst[(y * width + x) * 4 + channelIdx] =
        Math.max(0, Math.min(255, Math.round(sum / divisor)));
    }
  }
  return dst;
}

self.onmessage = ({ data }) => {
  const { imageDataArray, width, height, kernelFlat, divisor, channels, padding } = data;
  const channelMap = { R: 0, G: 1, B: 2, A: 3 };

  let result = new Uint8ClampedArray(imageDataArray);
  for (const ch of channels) {
    const idx = channelMap[ch];
    if (idx === undefined) continue;
    result = applyKernelToChannel(result, width, height, kernelFlat, divisor, idx, padding);
  }

  // Передаём обратно через transferable для скорости
  self.postMessage({ result: result.buffer }, [result.buffer]);
};
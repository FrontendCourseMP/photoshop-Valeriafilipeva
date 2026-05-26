// GrayBit-7 codec
// Signature: GB7· (0x47 0x42 0x37 0x1D)

export function decodeGB7(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);

  if (bytes.length < 12) throw new Error('File too small');
  if (bytes[0] !== 0x47 || bytes[1] !== 0x42 || bytes[2] !== 0x37 || bytes[3] !== 0x1D) {
    throw new Error('Invalid GB7 signature');
  }

  const version = bytes[4];
  if (version !== 0x01) throw new Error(`Unsupported GB7 version: ${version}`);

  const flags = bytes[5];
  const hasMask = (flags & 0x01) === 1;
  const width  = (bytes[6] << 8) | bytes[7];
  const height = (bytes[8] << 8) | bytes[9];
  // bytes[10-11] — reserved, skip

  if (bytes.length < 12 + width * height) throw new Error('File truncated');

  const imageData = new ImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < width * height; i++) {
    const byte = bytes[12 + i];
    // bits 6-0: grey value 0-127, scale to 0-255
    const grey = (byte & 0x7F) * 2;
    // bit 7: mask (if hasMask)
    const alpha = (hasMask && (byte & 0x80) === 0) ? 0 : 255;

    data[i * 4 + 0] = grey;
    data[i * 4 + 1] = grey;
    data[i * 4 + 2] = grey;
    data[i * 4 + 3] = alpha;
  }

  return { imageData, width, height, colorDepth: 7, hasMask };
}

export function encodeGB7(imageData) {
  const { width, height, data } = imageData;
  const out = new Uint8Array(12 + width * height);

  // Header
  out[0] = 0x47; out[1] = 0x42; out[2] = 0x37; out[3] = 0x1D;
  out[4] = 0x01; // version
  out[5] = 0x00; // no mask
  out[6] = (width  >> 8) & 0xFF;
  out[7] =  width        & 0xFF;
  out[8] = (height >> 8) & 0xFF;
  out[9] =  height       & 0xFF;
  out[10] = 0x00; out[11] = 0x00; // reserved

  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4 + 0];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Luminance → 7 bits
    const grey = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    out[12 + i] = (grey >> 1) & 0x7F;
  }

  return out;
}
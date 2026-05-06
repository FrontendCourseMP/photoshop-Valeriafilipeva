const { createApp, ref, onMounted } = Vue;
const { createVuetify } = Vuetify;

const GB7_SIGNATURE = [0x47, 0x42, 0x37, 0x1D]; // "GB7" + 0x1D

const app = createApp({
  setup() {
    const canvasRef = ref(null);
    const selectedFile = ref(null);

    const statusText = ref('Изображение не загружено');
    const hasImage = ref(false);

    const currentWidth = ref(0);
    const currentHeight = ref(0);
    const currentColorDepth = ref(null);
    const hasMaskFlag = ref(false);

    let ctx = null;

    onMounted(() => {
      const canvas = canvasRef.value;
      ctx = canvas.getContext('2d');
      updateStatusBar();
    });

    function updateStatusBar() {
      if (!currentWidth.value || !currentHeight.value) {
        statusText.value = 'Изображение не загружено';
        return;
      }

      const depth = currentColorDepth.value || 'неизвестна';
      statusText.value =
        `Размер: ${currentWidth.value}×${currentHeight.value} px | Глубина цвета: ${depth}`;
    }

    function drawImageToCanvas(image) {
      const canvas = canvasRef.value;
      canvas.width = image.width;
      canvas.height = image.height;

      currentWidth.value = image.width;
      currentHeight.value = image.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      hasImage.value = true;
      updateStatusBar();
    }

    function onFileChange(files) {
      const file = Array.isArray(files) ? files[0] : files;
      if (!file) return;

      const name = file.name.toLowerCase();

      if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
        loadStandardImage(file);
      } else if (name.endsWith('.gb7')) {
        loadGb7Image(file);
      } else {
        alert('Поддерживаются только файлы PNG, JPG и GB7');
      }
    }

    function loadStandardImage(file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        currentColorDepth.value = '24 бита (RGB)';
        hasMaskFlag.value = false;
        drawImageToCanvas(img);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        alert('Ошибка при загрузке изображения');
      };
      img.src = url;
    }

    function parseGb7Header(dataView) {
      for (let i = 0; i < 4; i++) {
        if (dataView.getUint8(i) !== GB7_SIGNATURE[i]) {
          throw new Error('Неверная сигнатура GB7');
        }
      }

      const version = dataView.getUint8(4);
      if (version !== 0x01) {
        throw new Error('Неподдерживаемая версия GB7');
      }

      const flag = dataView.getUint8(5);
      const maskFlag = (flag & 0x01) === 1;

      const width = dataView.getUint16(6, false);  // big-endian
      const height = dataView.getUint16(8, false); // big-endian

      const reserved = dataView.getUint16(10, false);
      // reserved по ТЗ = 0x0000, читаем, но не используем

      return { width, height, maskFlag };
    }

    function decodeGb7ToImageData(arrayBuffer) {
      const dataView = new DataView(arrayBuffer);
      const { width, height, maskFlag } = parseGb7Header(dataView);

      const pixelCount = width * height;
      const expectedLength = 12 + pixelCount;
      if (arrayBuffer.byteLength < expectedLength) {
        throw new Error('Файл GB7 поврежден или неполный');
      }

      const imageData = ctx.createImageData(width, height);
      const out = imageData.data;

      let srcOffset = 12;
      let dstOffset = 0;

      for (let i = 0; i < pixelCount; i++) {
        const byte = dataView.getUint8(srcOffset++);

        const gray7 = byte & 0x7F;          // 7 младших бит
        const maskBit = (byte & 0x80) !== 0; // старший бит

        const gray = Math.round(gray7 / 127 * 255);

        out[dstOffset] = gray;
        out[dstOffset + 1] = gray;
        out[dstOffset + 2] = gray;

        if (maskFlag) {
          // 0 — замаскирован (прозрачный), 1 — не замаскирован
          out[dstOffset + 3] = maskBit ? 255 : 0;
        } else {
          out[dstOffset + 3] = 255;
        }

        dstOffset += 4;
      }

      return { imageData, width, height, maskFlag };
    }

    async function loadGb7Image(file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const { imageData, width, height, maskFlag } = decodeGb7ToImageData(arrayBuffer);

        const canvas = canvasRef.value;
        canvas.width = width;
        canvas.height = height;

        currentWidth.value = width;
        currentHeight.value = height;

        ctx.putImageData(imageData, 0, 0);

        hasMaskFlag.value = maskFlag;
        currentColorDepth.value = maskFlag
          ? '7+1 бит (7 бит серого + маска)'
          : '7 бит (оттенки серого)';

        hasImage.value = true;
        updateStatusBar();
      } catch (e) {
        console.error(e);
        alert('Ошибка при загрузке GB7: ' + e.message);
      }
    }

    function createGb7Header(width, height, maskFlag) {
      const buffer = new ArrayBuffer(12);
      const view = new DataView(buffer);

      for (let i = 0; i < 4; i++) {
        view.setUint8(i, GB7_SIGNATURE[i]);
      }

      view.setUint8(4, 0x01);

      let flag = 0;
      if (maskFlag) {
        flag |= 0x01;
      }
      view.setUint8(5, flag);

      view.setUint16(6, width, false);
      view.setUint16(8, height, false);

      view.setUint16(10, 0x0000, false);

      return buffer;
    }

    function encodeCanvasToGb7(maskFlag) {
      if (!currentWidth.value || !currentHeight.value) {
        throw new Error('Нет изображения для кодирования');
      }

      const width = currentWidth.value;
      const height = currentHeight.value;

      const imageData = ctx.getImageData(0, 0, width, height);
      const src = imageData.data;

      const headerBuffer = createGb7Header(width, height, maskFlag);
      const pixelCount = width * height;
      const pixelsBuffer = new ArrayBuffer(pixelCount);
      const pixelsView = new DataView(pixelsBuffer);

      let srcOffset = 0;
      let dstOffset = 0;

      for (let i = 0; i < pixelCount; i++) {
        const r = src[srcOffset];
        const g = src[srcOffset + 1];
        const b = src[srcOffset + 2];
        const a = src[srcOffset + 3];

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const grayClamped = Math.max(0, Math.min(255, gray));

        const gray7 = Math.round(grayClamped / 255 * 127);

        let byte = gray7 & 0x7F;

        if (maskFlag) {
          if (a > 0) {
            byte |= 0x80;
          }
        }

        pixelsView.setUint8(dstOffset++, byte);
        srcOffset += 4;
      }

      const result = new Uint8Array(12 + pixelCount);
      result.set(new Uint8Array(headerBuffer), 0);
      result.set(new Uint8Array(pixelsBuffer), 12);

      return result.buffer;
    }

    function downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function downloadAsPng() {
      if (!hasImage.value) return;
      const canvas = canvasRef.value;
      canvas.toBlob((blob) => {
        if (!blob) return;
        downloadBlob(blob, 'image.png');
      }, 'image/png');
    }

    function downloadAsJpg() {
      if (!hasImage.value) return;
      const canvas = canvasRef.value;
      canvas.toBlob((blob) => {
        if (!blob) return;
        downloadBlob(blob, 'image.jpg');
      }, 'image/jpeg', 0.92);
    }

    function downloadAsGb7() {
      if (!hasImage.value) return;
      try {
        const buffer = encodeCanvasToGb7(true);
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        downloadBlob(blob, 'image.gb7');
      } catch (e) {
        console.error(e);
        alert('Ошибка при кодировании GB7: ' + e.message);
      }
    }

    return {
      canvasRef,
      selectedFile,
      statusText,
      hasImage,
      onFileChange,
      downloadAsPng,
      downloadAsJpg,
      downloadAsGb7,
    };
  },
});

const vuetify = createVuetify();
app.use(vuetify);
app.mount('#app');

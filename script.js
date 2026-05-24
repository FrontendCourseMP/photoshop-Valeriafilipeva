const { createApp, ref, onMounted } = Vue;
const { createVuetify } = Vuetify;

const GB7_SIGNATURE = [0x47, 0x42, 0x37, 0x1d];

const app = createApp({
  setup() {
    const canvasRef = ref(null);
    const selectedFile = ref(null);
    const statusText = ref("Изображение не загружено");
    const hasImage = ref(false);

    const currentWidth = ref(0);
    const currentHeight = ref(0);
    const currentColorDepth = ref(null);
    const hasMaskFlag = ref(false);

    // оригинальные пиксели (никогда не трогаем)
    const originalImageData = ref(null);

    // режимы каналов: 'gray' | 'grayAlpha' | 'rgb' | 'rgba'
    const activeMode = ref("rgba");

    // миниатюры режимов
    const modeGrayRef = ref(null);
    const modeGrayAlphaRef = ref(null);
    const modeRgbRef = ref(null);
    const modeRgbaRef = ref(null);

    // инструмент пипетка
    const activeTool = ref(null);
    const pipetteData = ref(null);

    // диалог сохранения
    const showSaveDialog = ref(false);
    const filenameInput = ref("");
    const pendingFormat = ref(null);

    let ctx = null;

    onMounted(() => {
      setTimeout(() => {
        const canvas = canvasRef.value;
        if (!canvas) {
          console.error("Canvas не найден!");
          return;
        }
        ctx = canvas.getContext("2d");
        updateStatusBar();
      }, 0);
    });

    function clearCanvas() {
      const canvas = canvasRef.value;
      if (!canvas) return;

      const c = canvas.getContext("2d");
      c.clearRect(0, 0, canvas.width, canvas.height);

      originalImageData.value = null;
      activeMode.value = "rgba";
      pipetteData.value = null;

      canvas.width = 400;
      canvas.height = 300;
    }

    function updateStatusBar() {
      if (!currentWidth.value || !currentHeight.value) {
        statusText.value = "Изображение не загружено";
        return;
      }
      const depth = currentColorDepth.value || "неизвестна";
      statusText.value = `Размер: ${currentWidth.value}×${currentHeight.value} px | Глубина цвета: ${depth}`;
    }

    function buildImageDataByMode(mode, srcImageData) {
      const width = srcImageData.width;
      const height = srcImageData.height;
      const src = srcImageData.data;

      const imageData = ctx.createImageData(width, height);
      const dst = imageData.data;

      for (let i = 0; i < width * height; i++) {
        const si = i * 4;
        const di = i * 4;

        const r0 = src[si];
        const g0 = src[si + 1];
        const b0 = src[si + 2];
        const a0 = src[si + 3];

        let r, g, b, a;

        if (mode === "gray" || mode === "grayAlpha") {
          const gray = Math.round(0.299 * r0 + 0.587 * g0 + 0.114 * b0);
          r = g = b = gray;
          a = mode === "grayAlpha" ? a0 : 255;
        } else if (mode === "rgb") {
          r = r0;
          g = g0;
          b = b0;
          a = 255;
        } else {
          // 'rgba'
          r = r0;
          g = g0;
          b = b0;
          a = a0;
        }

        dst[di] = r;
        dst[di + 1] = g;
        dst[di + 2] = b;
        dst[di + 3] = a;
      }

      return imageData;
    }

    function updateModePreviews() {
      if (!originalImageData.value) return;

      const src = originalImageData.value;

      function fillModeCanvas(canvasRef, mode) {
        const canvas = canvasRef.value;
        if (!canvas) return;

        canvas.width = src.width;
        canvas.height = src.height;

        const cctx = canvas.getContext("2d");
        const img = buildImageDataByMode(mode, src);
        cctx.putImageData(img, 0, 0);
      }

      fillModeCanvas(modeGrayRef, "gray");
      fillModeCanvas(modeGrayAlphaRef, "grayAlpha");
      fillModeCanvas(modeRgbRef, "rgb");
      fillModeCanvas(modeRgbaRef, "rgba");
    }

    function applyModeToCanvas() {
      if (!originalImageData.value || !ctx) return;

      const canvas = canvasRef.value;
      const src = originalImageData.value;

      canvas.width = src.width;
      canvas.height = src.height;

      const img = buildImageDataByMode(activeMode.value, src);
      ctx.putImageData(img, 0, 0);
    }

    function setMode(mode) {
      if (!originalImageData.value) return;
      activeMode.value = mode;
      applyModeToCanvas();
    }

    function drawImageToCanvas(image) {
      const canvas = canvasRef.value;
      canvas.width = image.width;
      canvas.height = image.height;

      currentWidth.value = image.width;
      currentHeight.value = image.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      originalImageData.value = ctx.getImageData(0, 0, canvas.width, canvas.height);

      activeMode.value = "rgba";
      updateModePreviews();
      applyModeToCanvas();

      hasImage.value = true;
      updateStatusBar();
    }

    function onFileChange(value) {
      let file = null;

      if (!value || (Array.isArray(value) && value.length === 0)) {
        hasImage.value = false;
        currentWidth.value = 0;
        currentHeight.value = 0;
        currentColorDepth.value = null;
        hasMaskFlag.value = false;
        statusText.value = "Изображение не загружено";

        clearCanvas();
        return;
      }

      if (Array.isArray(value)) {
        file = value[0];
      } else if (value instanceof File) {
        file = value;
      } else if (value?.target?.files?.length) {
        file = value.target.files[0];
      }

      if (!file) {
        console.warn("Файл не получен:", value);
        return;
      }

      const name = file.name.toLowerCase();

      if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
        loadStandardImage(file);
      } else if (name.endsWith(".gb7")) {
        loadGb7Image(file);
      } else {
        alert("Поддерживаются только файлы PNG, JPG и GB7");
      }
    }

        // Загружает обычные изображения PNG/JPG
    function loadStandardImage(file) {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        currentColorDepth.value = "24 бита (RGB)";
        hasMaskFlag.value = false;
        drawImageToCanvas(img);
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        alert("Ошибка при загрузке изображения");
      };

      img.src = url;
    }

    function parseGb7Header(dataView) {
      for (let i = 0; i < 4; i++) {
        if (dataView.getUint8(i) !== GB7_SIGNATURE[i]) {
          throw new Error("Неверная сигнатура GB7");
        }
      }

      const version = dataView.getUint8(4);
      if (version !== 0x01) {
        throw new Error("Неподдерживаемая версия GB7");
      }

      const flag = dataView.getUint8(5);
      const maskFlag = (flag & 0x01) === 1;

      const width = dataView.getUint16(6, false);
      const height = dataView.getUint16(8, false);
      const reserved = dataView.getUint16(10, false);

      return { width, height, maskFlag };
    }

    function decodeGb7ToImageData(arrayBuffer) {
      const dataView = new DataView(arrayBuffer);
      const { width, height, maskFlag } = parseGb7Header(dataView);

      const pixelCount = width * height;
      const expectedLength = 12 + pixelCount;

      if (arrayBuffer.byteLength < expectedLength) {
        throw new Error("Файл GB7 поврежден или неполный");
      }

      const imageData = ctx.createImageData(width, height);
      const out = imageData.data;

      let srcOffset = 12;
      let dstOffset = 0;

      for (let i = 0; i < pixelCount; i++) {
        const byte = dataView.getUint8(srcOffset++);

        const gray7 = byte & 0x7f;
        const maskBit = (byte & 0x80) !== 0;

        const gray = Math.round((gray7 / 127) * 255);

        out[dstOffset] = gray;
        out[dstOffset + 1] = gray;
        out[dstOffset + 2] = gray;

        if (maskFlag) {
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

        originalImageData.value = ctx.getImageData(0, 0, canvas.width, canvas.height);

        activeMode.value = "rgba";
        updateModePreviews();
        applyModeToCanvas();

        hasMaskFlag.value = maskFlag;
        currentColorDepth.value = maskFlag
          ? "7+1 бит (7 бит серого + маска)"
          : "7 бит (оттенки серого)";

        hasImage.value = true;
        updateStatusBar();
      } catch (e) {
        console.error(e);
        alert("Ошибка при загрузке GB7: " + e.message);
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
      if (maskFlag) flag |= 0x01;
      view.setUint8(5, flag);

      view.setUint16(6, width, false);
      view.setUint16(8, height, false);
      view.setUint16(10, 0x0000, false);

      return buffer;
    }

    function encodeCanvasToGb7(maskFlag) {
      if (!currentWidth.value || !currentHeight.value) {
        throw new Error("Нет изображения для кодирования");
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
        const gray7 = Math.round((grayClamped / 255) * 127);

        let byte = gray7 & 0x7f;

        if (maskFlag && a > 0) {
          byte |= 0x80;
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
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function openSaveDialog(format) {
      if (!hasImage.value) return;
      pendingFormat.value = format;

      filenameInput.value = "image";
      showSaveDialog.value = true;
    }

    function cancelSave() {
      showSaveDialog.value = false;
      pendingFormat.value = null;
      filenameInput.value = "";
    }

    function ensureExtension(filename, format) {
      const extMap = {
        png: ".png",
        jpg: ".jpg",
        gb7: ".gb7",
      };

      const ext = extMap[format];
      const name = filename.trim();

      if (!name) return "";

      return name.toLowerCase().endsWith(ext) ? name : name + ext;
    }

    function confirmSave() {
      const name = filenameInput.value.trim();
      if (!name) return;

      const format = pendingFormat.value;
      const finalName = ensureExtension(name, format);

      showSaveDialog.value = false;

      if (format === "png") doDownloadPng(finalName);
      else if (format === "jpg") doDownloadJpg(finalName);
      else if (format === "gb7") doDownloadGb7(finalName);
    }

    function doDownloadPng(filename) {
      if (!hasImage.value) return;
      const canvas = canvasRef.value;
      canvas.toBlob((blob) => {
        if (!blob) return;
        downloadBlob(blob, filename);
      }, "image/png");
    }

    function doDownloadJpg(filename) {
      if (!hasImage.value) return;
      const canvas = canvasRef.value;
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          downloadBlob(blob, filename);
        },
        "image/jpeg",
        0.92,
      );
    }

    function doDownloadGb7(filename) {
      if (!hasImage.value) return;
      try {
        const buffer = encodeCanvasToGb7(true);
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        downloadBlob(blob, filename);
      } catch (e) {
        console.error(e);
        alert("Ошибка при кодировании GB7: " + e.message);
      }
    }

        function togglePipette() {
      if (!hasImage.value) return;
      activeTool.value = activeTool.value === "pipette" ? null : "pipette";
    }

    function srgbToLinear(c) {
      c = c / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }

    function rgbToXyz(r, g, b) {
      const R = srgbToLinear(r);
      const G = srgbToLinear(g);
      const B = srgbToLinear(b);

      const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
      const Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
      const Z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;

      return { X, Y, Z };
    }

    function fLab(t) {
      const delta = 6 / 29;
      return t > Math.pow(delta, 3)
        ? Math.cbrt(t)
        : t / (3 * delta * delta) + 4 / 29;
    }

    function xyzToLab(X, Y, Z) {
      const Xn = 0.95047;
      const Yn = 1.0;
      const Zn = 1.08883;

      const fx = fLab(X / Xn);
      const fy = fLab(Y / Yn);
      const fz = fLab(Z / Zn);

      const L = 116 * fy - 16;
      const a = 500 * (fx - fy);
      const b = 200 * (fy - fz);

      return { L, a, b };
    }

    function rgbToLab(r, g, b) {
      const { X, Y, Z } = rgbToXyz(r, g, b);
      return xyzToLab(X, Y, Z);
    }

    function onCanvasClick(event) {
      if (activeTool.value !== "pipette") return;
      if (!hasImage.value) return;

      const canvas = canvasRef.value;
      const rect = canvas.getBoundingClientRect();

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.floor((event.clientX - rect.left) * scaleX);
      const y = Math.floor((event.clientY - rect.top) * scaleY);

      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

      // читаем именно с холста (с учётом выбранного режима каналов)
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];

      const lab = rgbToLab(r, g, b);

      pipetteData.value = {
        x,
        y,
        r,
        g,
        b,
        L: lab.L,
        a: lab.a,
        bLab: lab.b,
      };
    }

    return {
      canvasRef,
      selectedFile,
      statusText,
      hasImage,
      onFileChange,

      // сохранение
      openSaveDialog,
      cancelSave,
      confirmSave,
      showSaveDialog,
      filenameInput,

      // режимы каналов
      activeMode,
      modeGrayRef,
      modeGrayAlphaRef,
      modeRgbRef,
      modeRgbaRef,
      setMode,

      // пипетка
      activeTool,
      togglePipette,
      pipetteData,
      onCanvasClick,
    };
  },
});

const vuetify = createVuetify();
app.use(vuetify);
app.mount("#app");

const { createApp, ref, onMounted, nextTick } = Vue;
const { createVuetify } = Vuetify;

const GB7_SIGNATURE = [0x47, 0x42, 0x37, 0x1d];

createApp({
  setup() {
    const menuOpen = ref(false);
    const showChannelsPanel = ref(false);

    const canvasRef = ref(null);
    const channelRRef = ref(null);
    const channelGRef = ref(null);
    const channelBRef = ref(null);
    const channelARef = ref(null);

    const selectedFile = ref(null);
    const fileInputKey = ref(0);

    const hasImage = ref(false);
    const statusText = ref("Изображение не загружено");

    const currentWidth = ref(0);
    const currentHeight = ref(0);
    const currentColorDepth = ref("");
    const hasMaskFlag = ref(false);

    const originalImageData = ref(null);

    const channelR = ref(true);
    const channelG = ref(true);
    const channelB = ref(true);
    const channelA = ref(true);

    const activeTool = ref(null);
    const pipetteData = ref(null);

    const showSaveDialog = ref(false);
    const filenameInput = ref("");
    const pendingFormat = ref(null);

    let ctx = null;

    onMounted(async () => {
      await nextTick();
      ctx = canvasRef.value.getContext("2d");
      clearCanvasOnly();
      updateStatusBar();
    });

    function updateStatusBar() {
      if (!hasImage.value) {
        statusText.value = "Изображение не загружено";
        return;
      }
      statusText.value = `Размер: ${currentWidth.value}×${currentHeight.value} px | Глубина цвета: ${currentColorDepth.value}`;
    }

    function clearCanvasOnly() {
      if (!ctx || !canvasRef.value) return;
      const canvas = canvasRef.value;
      canvas.width = 700;
      canvas.height = 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#8a8a8a";
      ctx.font = "16px Arial";
      ctx.fillText("Загрузите изображение", 20, 30);
    }

    function resetAllState() {
      hasImage.value = false;
      currentWidth.value = 0;
      currentHeight.value = 0;
      currentColorDepth.value = "";
      hasMaskFlag.value = false;
      originalImageData.value = null;
      pipetteData.value = null;
      activeTool.value = null;
      channelR.value = true;
      channelG.value = true;
      channelB.value = true;
      channelA.value = true;
      statusText.value = "Изображение не загружено";
      clearCanvasOnly();
      updateChannelPreviewsEmpty();
    }

    function updateChannelPreviewsEmpty() {
      [channelRRef, channelGRef, channelBRef, channelARef].forEach((r) => {
        if (!r.value) return;
        const c = r.value;
        c.width = 1;
        c.height = 1;
        const cctx = c.getContext("2d");
        cctx.clearRect(0, 0, 1, 1);
      });
    }

    function buildImageDataByChannels(srcImageData) {
      const width = srcImageData.width;
      const height = srcImageData.height;
      const src = srcImageData.data;
      const imageData = ctx.createImageData(width, height);
      const dst = imageData.data;

      for (let i = 0; i < width * height; i++) {
        const si = i * 4;
        const di = i * 4;
        dst[di] = channelR.value ? src[si] : 0;
        dst[di + 1] = channelG.value ? src[si + 1] : 0;
        dst[di + 2] = channelB.value ? src[si + 2] : 0;
        dst[di + 3] = channelA.value ? src[si + 3] : 255;
      }

      return imageData;
    }

    function drawMainCanvas() {
      if (!ctx || !canvasRef.value) return;
      if (!originalImageData.value) {
        clearCanvasOnly();
        return;
      }
      const canvas = canvasRef.value;
      canvas.width = originalImageData.value.width;
      canvas.height = originalImageData.value.height;
      const out = buildImageDataByChannels(originalImageData.value);
      ctx.putImageData(out, 0, 0);
    }

    function makeChannelPreview(refCanvas, mode) {
      if (!originalImageData.value || !refCanvas.value) return;
      const src = originalImageData.value;
      const canvas = refCanvas.value;
      canvas.width = Math.max(1, Math.min(220, src.width));
      canvas.height = Math.max(1, Math.round((src.height / src.width) * canvas.width));
      const cctx = canvas.getContext("2d");

      const temp = cctx.createImageData(src.width, src.height);
      const s = src.data;
      const d = temp.data;

      for (let i = 0; i < src.width * src.height; i++) {
        const si = i * 4;
        const di = i * 4;
        let v = 0;
        if (mode === "r") v = s[si];
        if (mode === "g") v = s[si + 1];
        if (mode === "b") v = s[si + 2];
        if (mode === "a") v = s[si + 3];
        d[di] = v;
        d[di + 1] = v;
        d[di + 2] = v;
        d[di + 3] = 255;
      }

      const off = document.createElement("canvas");
      off.width = src.width;
      off.height = src.height;
      off.getContext("2d").putImageData(temp, 0, 0);
      cctx.clearRect(0, 0, canvas.width, canvas.height);
      cctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    }

    function updateAllPreviews() {
      makeChannelPreview(channelRRef, "r");
      makeChannelPreview(channelGRef, "g");
      makeChannelPreview(channelBRef, "b");
      makeChannelPreview(channelARef, "a");
    }

    function drawImageToCanvas(image) {
      const canvas = canvasRef.value;
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      originalImageData.value = ctx.getImageData(0, 0, canvas.width, canvas.height);
      currentWidth.value = image.width;
      currentHeight.value = image.height;
      hasImage.value = true;
      drawMainCanvas();
      updateAllPreviews();
      updateStatusBar();
    }

    function onFileChange(value) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        selectedFile.value = null;
        fileInputKey.value++;
        resetAllState();
        return;
      }

      const file = Array.isArray(value) ? value[0] : value instanceof File ? value : value?.target?.files?.[0];
      if (!file) return;

      const name = file.name.toLowerCase();
      if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
        loadStandardImage(file);
      } else if (name.endsWith(".gb7")) {
        loadGb7Image(file);
      } else {
        alert("Поддерживаются только PNG, JPG и GB7");
        selectedFile.value = null;
        fileInputKey.value++;
      }
    }

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
        if (dataView.getUint8(i) !== GB7_SIGNATURE[i]) throw new Error("Неверная сигнатура GB7");
      }
      if (dataView.getUint8(4) !== 0x01) throw new Error("Неподдерживаемая версия GB7");
      const flag = dataView.getUint8(5);
      const maskFlag = (flag & 0x01) === 1;
      const width = dataView.getUint16(6, false);
      const height = dataView.getUint16(8, false);
      const reserved = dataView.getUint16(10, false);
      if (reserved !== 0) throw new Error("Некорректный заголовок GB7");
      return { width, height, maskFlag };
    }

    function decodeGb7ToImageData(arrayBuffer) {
      const dataView = new DataView(arrayBuffer);
      const { width, height, maskFlag } = parseGb7Header(dataView);
      const pixelCount = width * height;
      if (arrayBuffer.byteLength < 12 + pixelCount) throw new Error("GB7 файл поврежден");
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
        out[dstOffset + 3] = maskFlag ? (maskBit ? 255 : 0) : 255;
        dstOffset += 4;
      }

      return { imageData, width, height, maskFlag };
    }

    async function loadGb7Image(file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const { imageData, width, height, maskFlag } = decodeGb7ToImageData(arrayBuffer);

        canvasRef.value.width = width;
        canvasRef.value.height = height;
        ctx.putImageData(imageData, 0, 0);

        originalImageData.value = ctx.getImageData(0, 0, width, height);
        currentWidth.value = width;
        currentHeight.value = height;
        currentColorDepth.value = maskFlag ? "7+1 бит (серый + маска)" : "7 бит (серый)";
        hasMaskFlag.value = maskFlag;
        hasImage.value = true;

        drawMainCanvas();
        updateAllPreviews();
        updateStatusBar();
      } catch (e) {
        alert("Ошибка при загрузке GB7: " + e.message);
      }
    }

    function createGb7Header(width, height, maskFlag) {
      const buffer = new ArrayBuffer(12);
      const view = new DataView(buffer);
      GB7_SIGNATURE.forEach((b, i) => view.setUint8(i, b));
      view.setUint8(4, 0x01);
      view.setUint8(5, maskFlag ? 0x01 : 0x00);
      view.setUint16(6, width, false);
      view.setUint16(8, height, false);
      view.setUint16(10, 0x0000, false);
      return buffer;
    }

    function encodeCanvasToGb7(maskFlag) {
      if (!ctx || !canvasRef.value || !originalImageData.value) throw new Error("Нет изображения");

      const width = canvasRef.value.width;
      const height = canvasRef.value.height;
      const src = ctx.getImageData(0, 0, width, height).data;

      const headerBuffer = createGb7Header(width, height, maskFlag);
      const pixelCount = width * height;
      const pixels = new Uint8Array(pixelCount);

      for (let i = 0; i < pixelCount; i++) {
        const si = i * 4;
        const r = src[si];
        const g = src[si + 1];
        const b = src[si + 2];
        const a = src[si + 3];

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const gray7 = Math.round((Math.max(0, Math.min(255, gray)) / 255) * 127);
        let byte = gray7 & 0x7f;
        if (maskFlag && a > 0) byte |= 0x80;
        pixels[i] = byte;
      }

      const result = new Uint8Array(12 + pixelCount);
      result.set(new Uint8Array(headerBuffer), 0);
      result.set(pixels, 12);
      return result.buffer;
    }

    function downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
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
      const map = { png: ".png", jpg: ".jpg", gb7: ".gb7" };
      const ext = map[format];
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

      if (format === "png") {
        canvasRef.value.toBlob((blob) => blob && downloadBlob(blob, finalName), "image/png");
      } else if (format === "jpg") {
        canvasRef.value.toBlob((blob) => blob && downloadBlob(blob, finalName), "image/jpeg", 0.92);
      } else if (format === "gb7") {
        try {
          const buffer = encodeCanvasToGb7(true);
          downloadBlob(new Blob([buffer], { type: "application/octet-stream" }), finalName);
        } catch (e) {
          alert("Ошибка при кодировании GB7: " + e.message);
        }
      }
    }

    function togglePipette() {
      if (!hasImage.value) return;
      activeTool.value = activeTool.value === "pipette" ? null : "pipette";
      menuOpen.value = false;
    }

    function toggleChannelsPanel() {
      showChannelsPanel.value = !showChannelsPanel.value;
      menuOpen.value = false;
    }

    function toggleChannel(ch) {
      if (ch === "r") channelR.value = !channelR.value;
      if (ch === "g") channelG.value = !channelG.value;
      if (ch === "b") channelB.value = !channelB.value;
      if (ch === "a") channelA.value = !channelA.value;
      drawMainCanvas();
    }

    function srgbToLinear(c) {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }

    function rgbToLab(r, g, b) {
      const R = srgbToLinear(r);
      const G = srgbToLinear(g);
      const B = srgbToLinear(b);

      const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
      const Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
      const Z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;

      const Xn = 0.95047;
      const Yn = 1.0;
      const Zn = 1.08883;
      const delta = 6 / 29;
      const f = (t) => (t > Math.pow(delta, 3) ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29);

      const fx = f(X / Xn);
      const fy = f(Y / Yn);
      const fz = f(Z / Zn);

      return {
        L: 116 * fy - 16,
        a: 500 * (fx - fy),
        b: 200 * (fy - fz),
      };
    }

    function onCanvasClick(event) {
      if (activeTool.value !== "pipette" || !hasImage.value || !ctx) return;

      const canvas = canvasRef.value;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.floor((event.clientX - rect.left) * scaleX);
      const y = Math.floor((event.clientY - rect.top) * scaleY);

      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const lab = rgbToLab(pixel[0], pixel[1], pixel[2]);

      pipetteData.value = {
        x,
        y,
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
        L: lab.L,
        a: lab.a,
        bLab: lab.b,
      };
    }

    return {
      menuOpen,
      showChannelsPanel,
      canvasRef,
      channelRRef,
      channelGRef,
      channelBRef,
      channelARef,
      selectedFile,
      fileInputKey,
      hasImage,
      statusText,
      onFileChange,
      openSaveDialog,
      cancelSave,
      confirmSave,
      showSaveDialog,
      filenameInput,
      activeTool,
      togglePipette,
      pipetteData,
      onCanvasClick,
      channelR,
      channelG,
      channelB,
      channelA,
      toggleChannel,
      toggleChannelsPanel,
    };
  },
}).use(createVuetify()).mount("#app");
const { createApp, ref, onMounted } = Vue;
const { createVuetify } = Vuetify;

const GB7_SIGNATURE = [0x47, 0x42, 0x37, 0x1d];

const app = createApp({
  setup() {
    // Ссылка на canvas, чтобы рисовать изображение и читать пиксели
    const canvasRef = ref(null);

    // Переменная под выбранный файл, если понадобится хранить его отдельно
    const selectedFile = ref(null);

    // Текст в строке состояния внизу окна
    const statusText = ref("Изображение не загружено");

    // Флаг: загружено ли сейчас изображение
    const hasImage = ref(false);

    // Текущая ширина и высота изображения
    const currentWidth = ref(0);
    const currentHeight = ref(0);

    // Глубина цвета текущего изображения
    const currentColorDepth = ref(null);

    // Флаг наличия маски в GB7
    const hasMaskFlag = ref(false);

    // Оригинальные пиксели изображения (никогда не трогаем)
    const originalImageData = ref(null);

    // Состояние каналов
    const channelR = ref(true);
    const channelG = ref(true);
    const channelB = ref(true);
    const channelA = ref(true);

    // Миниатюры каналов
    const channelRRef = ref(null);
    const channelGRef = ref(null);
    const channelBRef = ref(null);
    const channelARef = ref(null);

    // Активный инструмент: null | 'pipette'
    const activeTool = ref(null);

    // Данные пипетки
    const pipetteData = ref(null);

    // Диалог сохранения
    const showSaveDialog = ref(false);

    // Имя файла, которое вводит пользователь
    const filenameInput = ref("");

    // Формат, который сейчас ожидается для сохранения
    // 'png' | 'jpg' | 'gb7'
    const pendingFormat = ref(null);

    // Контекст canvas 2D, через него идет рисование и чтение пикселей
    let ctx = null;

    // Срабатывает после того, как компонент появился на странице
    // Нужен, чтобы получить доступ к canvas и его 2D-контексту
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

    function updateChannelPreviews() {
      if (!originalImageData.value) return;

      const src = originalImageData.value.data;
      const width = originalImageData.value.width;
      const height = originalImageData.value.height;

      function fillChannelCanvas(canvasRef, channelIndex) {
        const canvas = canvasRef.value;
        if (!canvas) return;

        canvas.width = width;
        canvas.height = height;

        const cctx = canvas.getContext("2d");
        const img = cctx.createImageData(width, height);
        const dst = img.data;

        for (let i = 0; i < width * height; i++) {
          const si = i * 4;
          const di = i * 4;

          const r = src[si];
          const g = src[si + 1];
          const b = src[si + 2];
          const a = src[si + 3];

          let value = 0;
          if (channelIndex === 0) value = r;
          if (channelIndex === 1) value = g;
          if (channelIndex === 2) value = b;
          if (channelIndex === 3) value = a;

          dst[di] = value;
          dst[di + 1] = value;
          dst[di + 2] = value;
          dst[di + 3] = 255;
        }

        cctx.putImageData(img, 0, 0);
      }

      fillChannelCanvas(channelRRef, 0);
      fillChannelCanvas(channelGRef, 1);
      fillChannelCanvas(channelBRef, 2);
      fillChannelCanvas(channelARef, 3);
    }

    function applyChannelsToCanvas() {
      if (!originalImageData.value || !ctx) return;

      const width = originalImageData.value.width;
      const height = originalImageData.value.height;
      const src = originalImageData.value.data;

      const imageData = ctx.createImageData(width, height);
      const dst = imageData.data;

      const useR = channelR.value;
      const useG = channelG.value;
      const useB = channelB.value;
      const useA = channelA.value;

      for (let i = 0; i < width * height; i++) {
        const si = i * 4;
        const di = i * 4;

        const r0 = src[si];
        const g0 = src[si + 1];
        const b0 = src[si + 2];
        const a0 = src[si + 3];

        let r = useR ? r0 : 0;
        let g = useG ? g0 : 0;
        let b = useB ? b0 : 0;
        let a;

        if (useA) {
          if (!useR && !useG && !useB) {
            // оставлен только альфа-канал — показываем маску прозрачности
            const gray = a0;
            r = gray;
            g = gray;
            b = gray;
            a = 255;
          } else {
            a = a0;
          }
        } else {
          // альфа выключен — считаем все непрозрачным
          a = 255;
        }

        dst[di] = r;
        dst[di + 1] = g;
        dst[di + 2] = b;
        dst[di + 3] = a;
      }

      const canvas = canvasRef.value;
      canvas.width = width;
      canvas.height = height;
      ctx.putImageData(imageData, 0, 0);
    }

    function toggleChannel(channel) {
      if (!originalImageData.value) return;

      if (channel === "r") channelR.value = !channelR.value;
      if (channel === "g") channelG.value = !channelG.value;
      if (channel === "b") channelB.value = !channelB.value;
      if (channel === "a") channelA.value = !channelA.value;

      applyChannelsToCanvas();
    }

    // Очищает canvas и возвращает его к стандартному размеру
    // Используется, когда пользователь убирает файл или сбрасывает изображение
    function clearCanvas() {
      const canvas = canvasRef.value;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      // Полная очистка области рисования
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      originalImageData.value = null;
      channelR.value = true;
      channelG.value = true;
      channelB.value = true;
      channelA.value = true;
      pipetteData.value = null;

      // Возвращаем холст к исходному размеру
      canvas.width = 400;
      canvas.height = 300;
    }

    // Обновляет текст в строке состояния
    // Показывает размеры изображения и глубину цвета
    function updateStatusBar() {
      if (!currentWidth.value || !currentHeight.value) {
        statusText.value = "Изображение не загружено";
        return;
      }
      const depth = currentColorDepth.value || "неизвестна";
      statusText.value = `Размер: ${currentWidth.value}×${currentHeight.value} px | Глубина цвета: ${depth}`;
    }

    // Рисует обычное изображение на canvas
    // Используется для PNG/JPG после загрузки через браузер
    function drawImageToCanvas(image) {
      const canvas = canvasRef.value;
      canvas.width = image.width;
      canvas.height = image.height;

      currentWidth.value = image.width;
      currentHeight.value = image.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      // сохраняем оригинальные пиксели
      originalImageData.value = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      // сбрасываем каналы
      channelR.value = true;
      channelG.value = true;
      channelB.value = true;
      channelA.value = true;

      // обновляем миниатюры и применяем каналы
      updateChannelPreviews();
      applyChannelsToCanvas();

      hasImage.value = true;
      updateStatusBar();
    }

    // Обрабатывает изменение файла в input
    // Определяет, какой файл выбран, и запускает нужный загрузчик
    function onFileChange(value) {
      let file = null;

      // Если файл убрали или input очистили
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

      // Определяем сам файл в зависимости от того, что пришло
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

      // Выбираем способ загрузки по расширению файла
      if (
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg")
      ) {
        loadStandardImage(file);
      } else if (name.endsWith(".gb7")) {
        loadGb7Image(file);
      } else {
        alert("Поддерживаются только файлы PNG, JPG и GB7");
      }
    }

    // Загружает обычные изображения PNG/JPG
    // Браузер сам декодирует файл, а потом мы рисуем картинку на canvas
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

    // Разбирает заголовок GB7-файла и извлекает основные параметры
    function parseGb7Header(dataView) {
      // Проверяем первые 4 байта — это "сигнатура" файла (тип файла)
      for (let i = 0; i < 4; i++) {
        // Если хотя бы один байт не совпадает — файл не GB7
        if (dataView.getUint8(i) !== GB7_SIGNATURE[i]) {
          throw new Error("Неверная сигнатура GB7");
        }
      }

      // Читаем версию формата (5-й байт)
      const version = dataView.getUint8(4);

      // Если версия не 1 — не поддерживаем такой файл
      if (version !== 0x01) {
        throw new Error("Неподдерживаемая версия GB7");
      }

      // Читаем байт флагов (6-й байт)
      const flag = dataView.getUint8(5);

      // Проверяем младший бит: есть ли маска прозрачности
      const maskFlag = (flag & 0x01) === 1;

      // Читаем ширину изображения (2 байта, big-endian)
      const width = dataView.getUint16(6, false);

      // Читаем высоту изображения (2 байта, big-endian)
      const height = dataView.getUint16(8, false);

      // Зарезервированное поле (пока не используется)
      const reserved = dataView.getUint16(10, false);

      // Возвращаем нужные данные
      return { width, height, maskFlag };
    }

    // Преобразует GB7-данные в ImageData (чтобы отобразить на canvas)
    function decodeGb7ToImageData(arrayBuffer) {
      // ArrayBuffer = "чемодан байтов" — сырые бинарные данные файла
      // Создаем DataView для чтения бинарных данных
      const dataView = new DataView(arrayBuffer);

      // Разбираем заголовок и получаем параметры изображения
      const { width, height, maskFlag } = parseGb7Header(dataView);

      // Общее количество пикселей
      const pixelCount = width * height;

      // Ожидаемый размер файла: 12 байт заголовок + пиксели
      const expectedLength = 12 + pixelCount;

      // Проверяем, что файл не обрезан
      if (arrayBuffer.byteLength < expectedLength) {
        throw new Error("Файл GB7 поврежден или неполный");
      }

      // Создаем пустое изображение для canvas
      const imageData = ctx.createImageData(width, height);

      // Массив, куда будем записывать RGBA пиксели
      const out = imageData.data;

      // Смещение в исходных данных (после заголовка)
      let srcOffset = 12;
      //  srcOffset = 12 (пропускаем заголовок)
      // srcOffset++ → 13, 14, 15... (читаем пиксели)

      // Смещение в выходном массиве (RGBA = 4 байта на пиксель), куда пишем в canvas
      let dstOffset = 0;
      //   dstOffset = 0, 4, 8... (каждый пиксель 4 байта)

      // Проходим по всем пикселям
      for (let i = 0; i < pixelCount; i++) {
        // Читаем 1 байт пикселя
        const byte = dataView.getUint8(srcOffset++);

        // Нижние 7 бит — оттенок серого (0–127)
        const gray7 = byte & 0x7f;

        // Старший бит — маска (прозрачность)
        const maskBit = (byte & 0x80) !== 0;

        // & 10000000 → "возьми только маску" → 10000000
        // // & 01111111 → "возьми только цвет" → 01110110

        // Преобразуем 7-битный серый в 8-битный (0–255)
        const gray = Math.round((gray7 / 127) * 255);

        // Записываем R, G, B (одинаковые — серый цвет)
        out[dstOffset] = gray;
        out[dstOffset + 1] = gray;
        out[dstOffset + 2] = gray;

        // Устанавливаем альфа-канал (прозрачность)
        if (maskFlag) {
          // Если есть маска — берем из старшего бита
          out[dstOffset + 3] = maskBit ? 255 : 0;
        } else {
          // Если маски нет — пиксель полностью непрозрачный
          out[dstOffset + 3] = 255;
        }

        // Переходим к следующему пикселю (4 байта)
        dstOffset += 4;
      }

      // Возвращаем результат
      return { imageData, width, height, maskFlag };
    }

    // Загружает файл, декодирует его и рисует на canvas
    async function loadGb7Image(file) {
      try {
        // Читаем файл как бинарные данные
        const arrayBuffer = await file.arrayBuffer();
        // ArrayBuffer = "чемодан байтов" — сырые бинарные данные файла

        // Декодируем файл в изображение
        const { imageData, width, height, maskFlag } =
          decodeGb7ToImageData(arrayBuffer);

        // Получаем canvas
        const canvas = canvasRef.value;

        // Устанавливаем размеры canvas
        canvas.width = width;
        canvas.height = height;

        // Сохраняем размеры в состоянии
        currentWidth.value = width;
        currentHeight.value = height;

        // Рисуем изображение на canvas
        ctx.putImageData(imageData, 0, 0);
        //Рисует изображение на canvas в позиции X=0, Y=0 (левый верхний угол)

        // сохраняем оригинальные пиксели
        originalImageData.value = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );

        // сбрасываем каналы
        channelR.value = true;
        channelG.value = true;
        channelB.value = true;
        channelA.value = true;

        // обновляем миниатюры и применяем каналы
        updateChannelPreviews();
        applyChannelsToCanvas();

        // Сохраняем информацию о маске
        hasMaskFlag.value = maskFlag;

        // Устанавливаем описание глубины цвета
        currentColorDepth.value = maskFlag
          ? "7+1 бит (7 бит серого + маска)"
          : "7 бит (оттенки серого)";

        // Отмечаем, что изображение загружено
        hasImage.value = true;

        // Обновляем статус
        updateStatusBar();
      } catch (e) {
        // Лог ошибки в консоль
        console.error(e);

        // Показываем сообщение пользователю
        alert("Ошибка при загрузке GB7: " + e.message);
      }
    }

    // Создает заголовок GB7-файла
    function createGb7Header(width, height, maskFlag) {
      // Выделяем 12 байт под заголовок
      const buffer = new ArrayBuffer(12);
      // "Дай мне 12 пустых ячеек по 1 байту"

      // DataView для записи
      const view = new DataView(buffer);
      // "Дай инструменты для записи чисел в эти 12 байт"

      // Записываем сигнатуру (тип файла)
      for (let i = 0; i < 4; i++) {
        view.setUint8(i, GB7_SIGNATURE[i]);
      }

      // Записываем версию (1)
      view.setUint8(4, 0x01);

      // Формируем байт флагов
      let flag = 0;

      // Если есть маска — устанавливаем первый бит
      if (maskFlag) flag |= 0x01;
      // |= = "поставить бит в 1" (битовое ИЛИ с присваиванием).

      // Записываем флаг
      view.setUint8(5, flag);
      // uint8:   байт  5 ← флаг (0-255)
      // uint16: байты 6-7 ← ширина (0-65535)
      // uint16: байты 8-9 ← высота (0-65535)

      // Записываем ширину
      view.setUint16(6, width, false);

      // Записываем высоту
      view.setUint16(8, height, false);

      // Записываем резерв (пока 0)
      view.setUint16(10, 0x0000, false);

      // Возвращаем готовый буфер
      return buffer;
    }

    // Кодирует изображение с canvas в формат GB7
    function encodeCanvasToGb7(maskFlag) {
      // Проверяем, что изображение есть
      if (!currentWidth.value || !currentHeight.value) {
        throw new Error("Нет изображения для кодирования");
      }

      // Получаем размеры
      const width = currentWidth.value;
      const height = currentHeight.value;

      // Берем пиксели с canvas
      const imageData = ctx.getImageData(0, 0, width, height);
      // !!!!!!!!

      // Исходный массив RGBA
      const src = imageData.data;

      // Создаем заголовок
      const headerBuffer = createGb7Header(width, height, maskFlag);

      // Количество пикселей
      const pixelCount = width * height;

      // Буфер для пикселей (по 1 байту на пиксель)
      const pixelsBuffer = new ArrayBuffer(pixelCount);
      // !!!!

      // DataView для записи пикселей
      const pixelsView = new DataView(pixelsBuffer);

      // Смещения
      let srcOffset = 0;
      let dstOffset = 0;
      // !!!!!

      // Проходим по пикселям
      for (let i = 0; i < pixelCount; i++) {
        // Читаем RGBA
        const r = src[srcOffset];
        const g = src[srcOffset + 1];
        const b = src[srcOffset + 2];
        const a = src[srcOffset + 3];

        // Переводим RGB в серый (формула яркости)
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Ограничиваем диапазон 0–255
        const grayClamped = Math.max(0, Math.min(255, gray));

        // Переводим в 7-битный формат (0–127)
        const gray7 = Math.round((grayClamped / 255) * 127);

        // Создаем байт (7 бит под серый)
        let byte = gray7 & 0x7f;

        // Если есть маска и пиксель не прозрачный
        if (maskFlag && a > 0) {
          // Устанавливаем старший бит
          byte |= 0x80;
        }

        // Записываем байт
        pixelsView.setUint8(dstOffset++, byte);

        // Переходим к следующему пикселю (RGBA = 4 байта)
        srcOffset += 4;
      }

      // Итоговый массив: заголовок + пиксели
      const result = new Uint8Array(12 + pixelCount);

      // Копируем заголовок
      result.set(new Uint8Array(headerBuffer), 0);

      // Копируем пиксели
      result.set(new Uint8Array(pixelsBuffer), 12);

      // Возвращаем как ArrayBuffer
      return result.buffer;
    }

    // Скачивает Blob как файл через браузер
    function downloadBlob(blob, filename) {
      // Создаем временную ссылку на файл
      const url = URL.createObjectURL(blob);

      // Создаем элемент <a>
      const a = document.createElement("a");

      // Указываем ссылку
      a.href = url;

      // Указываем имя файла
      a.download = filename;

      // Добавляем в DOM
      document.body.appendChild(a);

      // Программно кликаем (запускаем скачивание)
      a.click();

      // Удаляем ссылку
      document.body.removeChild(a);

      // Освобождаем память
      URL.revokeObjectURL(url);
    }

    // Открывает диалог сохранения и запоминает выбранный формат
    function openSaveDialog(format) {
      if (!hasImage.value) return;
      pendingFormat.value = format;

      if (format === "png") filenameInput.value = "image";
      if (format === "jpg") filenameInput.value = "image";
      if (format === "gb7") filenameInput.value = "image";

      showSaveDialog.value = true;
    }

    // Закрывает диалог сохранения и сбрасывает временные значения
    function cancelSave() {
      showSaveDialog.value = false;
      pendingFormat.value = null;
      filenameInput.value = "";
    }

    // Гарантирует, что у имени файла есть правильное расширение
    // Если расширения нет, оно добавляется автоматически
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

    // Подтверждает сохранение и вызывает нужную функцию скачивания
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

    // Сохраняет текущее изображение в PNG через canvas.toBlob()
    function doDownloadPng(filename) {
      if (!hasImage.value) return;
      const canvas = canvasRef.value;
      canvas.toBlob((blob) => {
        if (!blob) return;
        downloadBlob(blob, filename);
      }, "image/png");
    }

    // Сохраняет текущее изображение в JPG через canvas.toBlob()
    // quality=0.92 задает хорошее качество при нормальном размере файла
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

    // Кодирует текущее изображение в GB7 и скачивает его как файл
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
      // белая точка D65
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
      if (!originalImageData.value || !hasImage.value) return;

      const canvas = canvasRef.value;
      const rect = canvas.getBoundingClientRect();

      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.floor((event.clientX - rect.left) * scaleX);
      const y = Math.floor((event.clientY - rect.top) * scaleY);

      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

      const src = originalImageData.value.data;
      const index = (y * canvas.width + x) * 4;

      const r = src[index];
      const g = src[index + 1];
      const b = src[index + 2];

      const lab = rgbToLab(r, g, b);

      pipetteData.value = {
        x,
        y,
        r,
        g,
        b,
        L: lab.L,
        a: lab.a,
        b: lab.b,
      };
    }

    return {
  canvasRef,
  selectedFile,
  statusText,
  hasImage,
  onFileChange,
  openSaveDialog,
  cancelSave,
  confirmSave,
  showSaveDialog,
  filenameInput,

  // каналы
  channelR,
  channelG,
  channelB,
  channelA,
  channelRRef,
  channelGRef,
  channelBRef,
  channelARef,
  toggleChannel,

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

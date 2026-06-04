import { useRef, useState } from "react";
import { decodeGB7 } from "../lib/gb7";
import SaveDialog from "./SaveDialog";

export default function Toolbar({
  onImageLoad,
  onClear,
  imageData,
  imageInfo,
  activeTool,
  onToggleEyedropper,
  showChannels,
  onToggleChannels,
  onOpenLevels,
  onOpenResize,
  onReset,
}) {
  const fileInputRef = useRef(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [opening, setOpening] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setOpening(true);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "gb7") {
        const buffer = await file.arrayBuffer();
        const { imageData, width, height, colorDepth } = decodeGB7(buffer);
        onImageLoad(imageData, {
          width,
          height,
          colorDepth,
          fileName: file.name,
        });
      } else {
        const bitmap = await createImageBitmap(file);
        const { width, height } = bitmap;
        const offscreen = new OffscreenCanvas(width, height);
        const ctx = offscreen.getContext("2d");
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        const imgData = ctx.getImageData(0, 0, width, height);
        onImageLoad(imgData, {
          width,
          height,
          colorDepth: 8,
          fileName: file.name,
        });
      }
    } catch (err) {
      alert("Ошибка загрузки:\n" + err.message);
    } finally {
      setOpening(false);
    }
  };

  const handleClear = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClear();
  };

  const isEyedropper = activeTool === "eyedropper";

  const toolBtnStyle = (active) => ({
    borderColor: active ? "#9496a8" : "#3a3b47",
    color: active ? "#f0f0f5" : "#5a5c70",
    background: active ? "#32334a" : "transparent",
  });

  return (
    <>
      <div className="flex items-center gap-2 h-11 px-4 bg-[#1e1f26] border-b border-[#32333f] shrink-0">
        <span className="text-sm font-bold tracking-widest text-[#7c7f96] uppercase mr-3 select-none">
          Редактор изображений
        </span>

        <div className="w-px h-5 bg-[#32333f]" />

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.gb7"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={opening}
          className="px-3 py-1 text-sm rounded border border-[#3a3b47] text-[#a0a2b5]
                     hover:bg-[#2c2d38] hover:text-[#e0e1ea] transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {opening ? "Открытие…" : "Открыть"}
        </button>

        {imageData && (
          <>
            <button
              onClick={() => setSaveOpen(true)}
              disabled={opening}
              className="px-3 py-1 text-sm rounded border border-[#3a3b47] text-[#a0a2b5]
                         hover:bg-[#2c2d38] hover:text-[#e0e1ea] transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Сохранить как…
            </button>

            <div className="w-px h-5 bg-[#32333f] mx-1" />

            <button
              onClick={handleClear}
              disabled={opening}
              className="px-3 py-1 text-sm rounded border border-[#3a3b47] text-[#5a5c70]
                         hover:border-[#c0524a] hover:text-[#c0524a] transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Закрыть
            </button>

            <div className="w-px h-5 bg-[#32333f] mx-1" />

            <button
              onClick={onReset}
              disabled={opening}
              title="Сбросить все изменения и вернуть исходное изображение "
              className="px-3 py-1 text-sm rounded border border-[#3a3b47] text-[#5a5c70]
             hover:border-[#7c6a2a] hover:text-[#c8a84b] transition-colors
             disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Сбросить
            </button>

            <div className="w-px h-5 bg-[#32333f] mx-1" />

            <button
              onClick={onToggleEyedropper}
              title="Пипетка — кликните по пикселю изображения"
              className="px-3 py-1 text-sm rounded border transition-colors"
              style={toolBtnStyle(isEyedropper)}
            >
              Пипетка
            </button>

            <button
              onClick={onToggleChannels}
              title="Панель каналов"
              className="px-3 py-1 text-sm rounded border transition-colors"
              style={toolBtnStyle(showChannels)}
            >
              Каналы
            </button>

            <button
              onClick={onOpenLevels}
              title="Градационная коррекция уровней"
              className="px-3 py-1 text-sm rounded border transition-colors"
              style={toolBtnStyle(false)}
            >
              Уровни
            </button>

            <button
              onClick={onOpenResize}
              title="Изменить размер изображения"
              className="px-3 py-1 text-sm rounded border transition-colors"
              style={toolBtnStyle(false)}
            >
              Размер
            </button>
          </>
        )}

        <div className="flex-1" />
      </div>

      <SaveDialog
        isOpen={saveOpen}
        onClose={() => setSaveOpen(false)}
        imageData={imageData}
        originalFileName={imageInfo?.fileName}
      />
    </>
  );
}

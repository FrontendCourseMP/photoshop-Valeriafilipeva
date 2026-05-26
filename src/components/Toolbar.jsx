import { useRef, useState } from 'react';
import { decodeGB7 } from '../lib/gb7';
import SaveDialog from './SaveDialog';

export default function Toolbar({ onImageLoad, onClear, imageData, imageInfo }) {
  const fileInputRef = useRef(null);
  const [saveOpen, setSaveOpen] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      // Пользователь отменил диалог — ничего не делаем
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'gb7') {
      const buffer = await file.arrayBuffer();
      try {
        const { imageData, width, height, colorDepth } = decodeGB7(buffer);
        onImageLoad(imageData, { width, height, colorDepth, fileName: file.name });
      } catch (err) {
        alert('Failed to read GB7 file:\n' + err.message);
      }
    } else {
      // PNG / JPG через браузер
      const url = URL.createObjectURL(file);
      const img  = new Image();
      img.onload = () => {
        const c = Object.assign(document.createElement('canvas'), {
          width: img.naturalWidth, height: img.naturalHeight
        });
        c.getContext('2d').drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        onImageLoad(
          c.getContext('2d').getImageData(0, 0, c.width, c.height),
          { width: img.naturalWidth, height: img.naturalHeight, colorDepth: 8, fileName: file.name }
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); alert('Cannot load image'); };
      img.src = url;
    }

    // Сброс input — чтобы можно было повторно открыть тот же файл
    e.target.value = '';
  };

  const handleClear = () => {
    // Сброс input + очистка состояния
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear();
  };

  return (
    <>
      <div className="flex items-center gap-1.5 h-9 px-3 bg-[#111113] border-b border-[#27272a] shrink-0">

        {/* Open */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.gb7"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 text-xs rounded border border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#f4f4f5] transition-colors"
        >
          Open
        </button>

        {/* Save и Clear — только если есть изображение */}
        {imageData && (
          <>
            <button
              onClick={() => setSaveOpen(true)}
              className="px-3 py-1 text-xs rounded border border-[#3f3f46] text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#f4f4f5] transition-colors"
            >
              Save As…
            </button>

            <div className="w-px h-4 bg-[#3f3f46] mx-1" />

            <button
              onClick={handleClear}
              className="px-3 py-1 text-xs rounded border border-[#3f3f46] text-[#52525b] hover:border-[#ef4444] hover:text-[#ef4444] transition-colors"
              title="Close image and clear canvas"
            >
              Close
            </button>
          </>
        )}

        {/* Место для инструментов лаб 2–5 */}
        <div className="flex-1" />
        <div id="toolbar-extra" className="flex gap-1" />

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
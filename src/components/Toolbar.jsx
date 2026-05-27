import { useRef, useState } from 'react';
import { decodeGB7 } from '../lib/gb7';
import SaveDialog from './SaveDialog';

export default function Toolbar({ onImageLoad, onClear, imageData, imageInfo }) {
  const fileInputRef = useRef(null);
  const [saveOpen, setSaveOpen]   = useState(false);
  const [opening, setOpening]     = useState(false); // блокируем кнопку пока идёт загрузка

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    setOpening(true);

    // Небольшая задержка чтобы UI успел обновиться (показать состояние кнопки)
    await new Promise(r => setTimeout(r, 30));

    const ext = file.name.split('.').pop().toLowerCase();

    try {
      if (ext === 'gb7') {
        const buffer = await file.arrayBuffer();
        const { imageData, width, height, colorDepth } = decodeGB7(buffer);
        onImageLoad(imageData, { width, height, colorDepth, fileName: file.name });
      } else {
        // PNG/JPG — через OffscreenCanvas если доступен, иначе обычный
        const imageBitmap = await createImageBitmap(file).catch(() => null);

        if (imageBitmap) {
          // Современный быстрый путь
          const canvas = document.createElement('canvas');
          canvas.width  = imageBitmap.width;
          canvas.height = imageBitmap.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imageBitmap, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          imageBitmap.close();
          onImageLoad(imgData, {
            width: canvas.width, height: canvas.height,
            colorDepth: 8, fileName: file.name
          });
        } else {
          // Fallback через Image
          await new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img  = new Image();
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = img.naturalWidth; c.height = img.naturalHeight;
              c.getContext('2d').drawImage(img, 0, 0);
              URL.revokeObjectURL(url);
              onImageLoad(
                c.getContext('2d').getImageData(0, 0, c.width, c.height),
                { width: img.naturalWidth, height: img.naturalHeight, colorDepth: 8, fileName: file.name }
              );
              resolve();
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось загрузить')); };
            img.src = url;
          });
        }
      }
    } catch (err) {
      alert('Ошибка загрузки:\n' + err.message);
    } finally {
      setOpening(false);
    }
  };

  const handleClear = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear();
  };

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
          {opening ? 'Открытие…' : 'Открыть'}
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
              title="Закрыть изображение и очистить холст"
            >
              Закрыть
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
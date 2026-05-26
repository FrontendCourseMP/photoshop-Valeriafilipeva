import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import { encodeGB7 } from '../lib/gb7';

export default function SaveDialog({ isOpen, onClose, imageData, originalFileName }) {
  const [name, setName] = useState('image');
  const [format, setFormat] = useState('png');

  // При открытии подставляем имя из оригинального файла (без расширения)
  useEffect(() => {
    if (isOpen && originalFileName) {
      setName(originalFileName.replace(/\.[^.]+$/, ''));
    }
  }, [isOpen, originalFileName]);

  const handleSave = () => {
    if (!imageData) return;

    if (format === 'gb7') {
      const bytes = encodeGB7(imageData);
      triggerDownload(new Blob([bytes], { type: 'application/octet-stream' }), `${name}.gb7`);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      canvas.getContext('2d').putImageData(imageData, 0, 0);
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      canvas.toBlob((blob) => {
        triggerDownload(blob, `${name}.${format}`);
      }, mime, 0.95);
    }
    onClose();
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  };

  // Глубина цвета зависит от формата
  const depthLabel = format === 'gb7' ? '7-bit gray' : format === 'jpg' ? '8-bit' : '8-bit + alpha';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Image"
      footer={<>
        <button onClick={onClose}
          className="px-4 py-1.5 text-xs rounded border border-[#3f3f46] text-[#a1a1aa] hover:bg-[#3f3f46] transition-colors">
          Cancel
        </button>
        <button onClick={handleSave}
          className="px-4 py-1.5 text-xs rounded bg-[#3f3f46] hover:bg-[#52525b] text-[#f4f4f5] transition-colors">
          Save
        </button>
      </>}
    >
      <div className="flex flex-col gap-4 text-xs">

        {/* Формат */}
        <div>
          <label className="block text-[#71717a] mb-1.5 tracking-wider uppercase">Format</label>
          <div className="flex gap-2">
            {['png', 'jpg', 'gb7'].map(f => (
              <button key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1.5 rounded border transition-colors uppercase tracking-wider ${
                  format === f
                    ? 'border-[#71717a] text-[#f4f4f5] bg-[#3f3f46]'
                    : 'border-[#3f3f46] text-[#71717a] hover:border-[#52525b]'
                }`}
              >{f}</button>
            ))}
          </div>
          <span className="text-[#52525b] mt-1 block">{depthLabel}</span>
        </div>

        {/* Имя файла */}
        <div>
          <label className="block text-[#71717a] mb-1.5 tracking-wider uppercase">File name</label>
          <div className="flex items-center border border-[#3f3f46] rounded overflow-hidden focus-within:border-[#71717a] transition-colors">
            <input
              value={name}
              onChange={e => setName(e.target.value.replace(/[/\\?%*:|"<>]/g, ''))}
              className="flex-1 bg-transparent px-3 py-1.5 text-[#f4f4f5] outline-none min-w-0"
              placeholder="filename"
              spellCheck={false}
            />
            {/* Расширение нельзя изменить — оно зафиксировано */}
            <span className="px-3 py-1.5 text-[#52525b] bg-[#18181b] border-l border-[#3f3f46] select-none">
              .{format}
            </span>
          </div>
        </div>

      </div>
    </Modal>
  );
}
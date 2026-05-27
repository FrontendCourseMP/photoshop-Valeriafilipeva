import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import { encodeGB7 } from '../lib/gb7';

export default function SaveDialog({ isOpen, onClose, imageData, originalFileName }) {
  const [name, setName]     = useState('изображение');
  const [format, setFormat] = useState('png');

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
      canvas.toBlob(blob => triggerDownload(blob, `${name}.${format}`), mime, 0.95);
    }
    onClose();
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  };

  const depthLabel = { png: '8-бит + альфа', jpg: '8-бит', gb7: '7-бит оттенки серого' }[format];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Сохранить изображение"
      footer={<>
        <button onClick={onClose}
          className="px-4 py-1.5 text-sm rounded border border-[#3a3b47] text-[#7c7f96] hover:bg-[#2c2d38] transition-colors">
          Отмена
        </button>
        <button onClick={handleSave}
          className="px-4 py-1.5 text-sm rounded bg-[#3a3b47] hover:bg-[#484a5a] text-[#e0e1ea] transition-colors">
          Сохранить
        </button>
      </>}
    >
      <div className="flex flex-col gap-4 text-sm">

        <div>
          <label className="block text-[#6b6e85] mb-1.5 tracking-wider uppercase text-xs">Формат</label>
          <div className="flex gap-2">
            {['png', 'jpg', 'gb7'].map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`px-3 py-1.5 rounded border transition-colors uppercase tracking-wider text-xs ${
                  format === f
                    ? 'border-[#7c7f96] text-[#e0e1ea] bg-[#3a3b47]'
                    : 'border-[#32333f] text-[#6b6e85] hover:border-[#4a4b5a]'
                }`}>
                {f}
              </button>
            ))}
          </div>
          <span className="text-[#4a4b5a] mt-1 block text-xs">{depthLabel}</span>
        </div>

        <div>
          <label className="block text-[#6b6e85] mb-1.5 tracking-wider uppercase text-xs">Имя файла</label>
          <div className="flex items-center border border-[#3a3b47] rounded overflow-hidden focus-within:border-[#7c7f96] transition-colors">
            <input
              value={name}
              onChange={e => setName(e.target.value.replace(/[/\\?%*:|"<>]/g, ''))}
              className="flex-1 bg-transparent px-3 py-1.5 text-[#e0e1ea] outline-none min-w-0 text-sm"
              placeholder="имя файла"
              spellCheck={false}
            />
            <span className="px-3 py-1.5 text-[#4a4b5a] bg-[#1a1b22] border-l border-[#3a3b47] select-none text-sm">
              .{format}
            </span>
          </div>
        </div>

      </div>
    </Modal>
  );
}
import { useState, useEffect, useCallback, useRef } from 'react';
import Modal from './ui/Modal';
import Histogram from './Histogram';
import LevelsSlider from './LevelsSlider';
import { defaultLevelsAll, applyAllLevels } from '../lib/levels';

const CHANNEL_OPTIONS = [
  { value: 'master', label: 'Все каналы (Master)' },
  { value: 'R',      label: 'Красный (R)' },
  { value: 'G',      label: 'Зелёный (G)' },
  { value: 'B',      label: 'Синий (B)' },
  { value: 'A',      label: 'Альфа (A)' },
];

export default function LevelsDialog({
  isOpen,
  onClose,
  originalImageData,
  onApply,
  onPreview,
  onCancelPreview,
}) {
  const [channel,   setChannel]   = useState('master');
  const [levels,    setLevels]    = useState(defaultLevelsAll());
  const [preview,   setPreview]   = useState(true);
  const [logScale,  setLogScale]  = useState(false);

  // Троттлинг для превью
  const rafRef = useRef(null);

  // Сбрасываем при открытии
  useEffect(() => {
    if (isOpen) {
      setLevels(defaultLevelsAll());
      setChannel('master');
      setPreview(true);
    }
  }, [isOpen]);

  // Применяем превью при изменении уровней
  useEffect(() => {
    if (!isOpen || !originalImageData) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (preview) {
      rafRef.current = requestAnimationFrame(() => {
        const result = applyAllLevels(originalImageData, levels);
        onPreview(result);
      });
    } else {
      onCancelPreview();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, preview, isOpen]);

  const handleSliderChange = useCallback((vals) => {
    setLevels(prev => ({ ...prev, [channel]: vals }));
  }, [channel]);

  const handleReset = () => {
    setLevels(defaultLevelsAll());
  };

  const handleCancel = () => {
    onCancelPreview();
    onClose();
  };

  const handleApply = () => {
    if (!originalImageData) return;
    const result = applyAllLevels(originalImageData, levels);
    onApply(result);
    onClose();
  };

  const current = levels[channel];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Уровни"
      footer={<>
        <button
          onClick={handleReset}
          className="px-4 py-1.5 text-sm rounded border border-[#3a3b47] text-[#7c7f96] hover:bg-[#2c2d38] transition-colors mr-auto"
        >
          Сбросить
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-1.5 text-sm rounded border border-[#3a3b47] text-[#7c7f96] hover:bg-[#2c2d38] transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-1.5 text-sm rounded bg-[#3a3b47] hover:bg-[#484a5a] text-[#e0e1ea] transition-colors"
        >
          Применить
        </button>
      </>}
    >
      <div className="flex flex-col gap-4 min-w-[340px]">

        {/* Выбор канала */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider w-16">Канал</span>
          <select
            value={channel}
            onChange={e => setChannel(e.target.value)}
            className="flex-1 bg-[#1a1b22] border border-[#3a3b47] rounded px-2 py-1 text-xs text-[#c9cad1] outline-none"
          >
            {CHANNEL_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Гистограмма */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider">
              Гистограмма
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={logScale}
                onChange={e => setLogScale(e.target.checked)}
                className="accent-[#7c7f96]"
              />
              <span className="text-[10px] text-[#7c7f96]">Лог. шкала</span>
            </label>
          </div>
          {originalImageData && (
            <Histogram
              imageData={originalImageData}
              channel={channel}
              logScale={logScale}
            />
          )}
        </div>

        {/* Слайдеры */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider mb-1">
            Входные уровни
          </span>
          <LevelsSlider
            black={current.black}
            gamma={current.gamma}
            white={current.white}
            onChange={handleSliderChange}
          />
        </div>

        {/* Текущие значения */}
        <div className="flex gap-3 text-[10px] text-[#5a5c70] border-t border-[#2e2f3a] pt-2">
          <span>Чёрная: <span className="text-[#9496a8]">{current.black}</span></span>
          <span>Гамма: <span className="text-[#9496a8]">{current.gamma.toFixed(2)}</span></span>
          <span>Белая: <span className="text-[#9496a8]">{current.white}</span></span>
        </div>

        {/* Превью чекбокс */}
        <label className="flex items-center gap-2 cursor-pointer border-t border-[#2e2f3a] pt-2">
          <input
            type="checkbox"
            checked={preview}
            onChange={e => setPreview(e.target.checked)}
            className="accent-[#7c7f96]"
          />
          <span className="text-xs text-[#7c7f96]">Предпросмотр в реальном времени</span>
        </label>

      </div>
    </Modal>
  );
}
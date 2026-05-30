import { useState, useEffect, useRef } from 'react';
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
  const dialogRef  = useRef(null);
  const timerRef   = useRef(null);
  const levelsRef  = useRef(defaultLevelsAll());

  const [channel,     setChannel]     = useState('master');
  const [levels,      setLevels]      = useState(defaultLevelsAll);
  const [savedLevels, setSavedLevels] = useState(defaultLevelsAll);
  const [preview,     setPreview]     = useState(true);
  const [logScale,    setLogScale]    = useState(false);

  // Синхронизируем ref с state
  useEffect(() => {
    levelsRef.current = levels;
  }, [levels]);

  // Открываем/закрываем <dialog>
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (isOpen) {
      setPreview(true);
      setLogScale(false);
      if (!d.open) d.showModal();
    } else {
      if (d.open) d.close();
    }
  }, [isOpen]);

  // Превью с троттлингом 100мс
  useEffect(() => {
    if (!isOpen || !originalImageData) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (preview) {
      timerRef.current = setTimeout(() => {
        const result = applyAllLevels(originalImageData, levelsRef.current);
        onPreview(result);
      }, 100);
    } else {
      onCancelPreview();
    }

    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, preview, isOpen]);

  const handleSliderChange = (vals) => {
    setLevels(prev => {
      const next = { ...prev, [channel]: vals };
      levelsRef.current = next;
      return next;
    });
  };

  const handleReset = () => {
    const def = defaultLevelsAll();
    levelsRef.current = def;
    setLevels(def);
    setSavedLevels(def);
  };

  const handleCancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Возвращаем уровни к состоянию на момент открытия
    levelsRef.current = savedLevels;
    setLevels(savedLevels);
    onCancelPreview();
    onClose();
  };

  const handleApply = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!originalImageData) { onClose(); return; }
    // Берём из ref — всегда актуальные значения
    const result = applyAllLevels(originalImageData, levelsRef.current);
    setSavedLevels(levelsRef.current);
    onApply(result);
  };

  const current = levels[channel];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="bg-[#22232b] text-[#c9cad1] rounded-lg shadow-2xl border border-[#32333f] p-0"
      style={{ minWidth: '380px', maxWidth: '90vw' }}
    >
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#32333f]">
        <span className="text-xs font-bold tracking-widest uppercase text-[#9496a8]">
          Уровни
        </span>
        <button
          onClick={handleCancel}
          className="text-[#5a5c70] hover:text-[#c9cad1] transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-[#32333f]"
        >
          ✕
        </button>
      </div>

      {/* Содержимое */}
      <div className="p-4 flex flex-col gap-4">

        {/* Канал */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider w-16 shrink-0">
            Канал
          </span>
          <select
            value={channel}
            onChange={e => setChannel(e.target.value)}
            className="flex-1 bg-[#1a1b22] border border-[#3a3b47] rounded px-2 py-1 text-xs text-[#c9cad1] outline-none cursor-pointer"
          >
            {CHANNEL_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Гистограмма */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider">
              Гистограмма
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={logScale}
                onChange={e => setLogScale(e.target.checked)}
                className="accent-[#7c7f96] cursor-pointer"
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
        <div>
          <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider block mb-2">
            Входные уровни
          </span>
          <LevelsSlider
            black={current.black}
            gamma={current.gamma}
            white={current.white}
            onChange={handleSliderChange}
          />
        </div>

        {/* Значения */}
        <div className="flex gap-4 text-[10px] text-[#5a5c70] border-t border-[#2e2f3a] pt-2">
          <span>
            Чёрная:{' '}
            <span className="text-[#9496a8] tabular-nums">{current.black}</span>
          </span>
          <span>
            Гамма:{' '}
            <span className="text-[#9496a8] tabular-nums">{current.gamma.toFixed(2)}</span>
          </span>
          <span>
            Белая:{' '}
            <span className="text-[#9496a8] tabular-nums">{current.white}</span>
          </span>
        </div>

        {/* Превью */}
        <label className="flex items-center gap-2 cursor-pointer select-none border-t border-[#2e2f3a] pt-2">
          <input
            type="checkbox"
            checked={preview}
            onChange={e => setPreview(e.target.checked)}
            className="accent-[#7c7f96] cursor-pointer"
          />
          <span className="text-xs text-[#7c7f96]">
            Предпросмотр в реальном времени
          </span>
        </label>

      </div>

      {/* Футер */}
      <div className="flex gap-2 items-center px-4 py-3 border-t border-[#32333f]">
        <button
          onClick={handleReset}
          className="px-4 py-1.5 text-sm rounded border border-[#3a3b47] text-[#7c7f96] hover:bg-[#2c2d38] transition-colors"
          title="Сбросить все каналы к исходным значениям"
        >
          Сбросить
        </button>
        <div className="flex-1" />
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
      </div>
    </dialog>
  );
}
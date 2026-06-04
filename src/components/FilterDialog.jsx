import { useState, useEffect, useRef } from 'react';
import { PRESETS, PADDING_STRATEGIES } from '../lib/kernels';

const DEFAULT_KERNEL = [0,0,0, 0,1,0, 0,0,0];
const DEFAULT_DIVISOR = 1;

const CHANNEL_LIST = [
  { key: 'R', label: 'R', color: '#c05555' },
  { key: 'G', label: 'G', color: '#55a855' },
  { key: 'B', label: 'B', color: '#5577c0' },
  { key: 'A', label: 'A', color: '#888888' },
];

export default function FilterDialog({
  isOpen, onClose,
  originalImageData,
  onApply, onPreview, onCancelPreview,
}) {
  const dialogRef  = useRef(null);
  const workerRef  = useRef(null);
  const timerRef   = useRef(null);

  const [preset,    setPreset]    = useState('identity');
  const [kernel,    setKernel]    = useState([...DEFAULT_KERNEL]);
  const [divisor,   setDivisor]   = useState(DEFAULT_DIVISOR);
  const [channels,  setChannels]  = useState({ R: true, G: true, B: true, A: false });
  const [padding,   setPadding]   = useState('black');
  const [preview,   setPreview]   = useState(true);
  const [applying,  setApplying]  = useState(false);

  // Открываем/закрываем диалог
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (isOpen) {
      handlePresetChange('identity');
      setChannels({ R: true, G: true, B: true, A: false });
      setPadding('black');
      setPreview(true);
      if (!d.open) d.showModal();
    } else {
      if (d.open) d.close();
      // Завершаем воркер если открыт
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    }
  }, [isOpen]);

  // Превью с задержкой
  useEffect(() => {
    if (!isOpen || !originalImageData) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!preview) {
      onCancelPreview();
      return;
    }

    timerRef.current = setTimeout(() => {
      runConvolution(originalImageData, kernel, divisor, channels, padding)
        .then(result => { if (result) onPreview(result); });
    }, 150);

    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kernel, divisor, channels, padding, preview, isOpen]);

  // Запуск свёртки через Web Worker
  const runConvolution = (imageData, kern, div, chans, pad) => {
    return new Promise((resolve) => {
      // Завершаем предыдущий воркер
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }

      const selectedChannels = Object.entries(chans)
        .filter(([, v]) => v).map(([k]) => k);

      if (selectedChannels.length === 0) {
        resolve(imageData);
        return;
      }

      const worker = new Worker('/convolutionWorker.js');
      workerRef.current = worker;

      const copy = new Uint8ClampedArray(imageData.data);

      worker.onmessage = ({ data }) => {
        const result = new ImageData(
          new Uint8ClampedArray(data.result),
          imageData.width,
          imageData.height
        );
        workerRef.current = null;
        worker.terminate();
        resolve(result);
      };

      worker.onerror = () => {
        workerRef.current = null;
        worker.terminate();
        resolve(null);
      };

      worker.postMessage({
        imageDataArray: copy.buffer,
        width: imageData.width,
        height: imageData.height,
        kernelFlat: kern,
        divisor: div,
        channels: selectedChannels,
        padding: pad,
      }, [copy.buffer]);
    });
  };

  const handlePresetChange = (key) => {
    setPreset(key);
    const p = PRESETS[key];
    if (!p) return;
    setKernel(p.kernel.flat());
    setDivisor(p.divisor);
  };

  const handleKernelChange = (i, val) => {
    const v = parseFloat(val);
    setKernel(prev => {
      const next = [...prev];
      next[i] = isNaN(v) ? 0 : v;
      return next;
    });
    setPreset('custom');
  };

  const toggleChannel = (ch) => {
    setChannels(prev => ({ ...prev, [ch]: !prev[ch] }));
  };

  const handleReset = () => {
    handlePresetChange('identity');
    setChannels({ R: true, G: true, B: true, A: false });
    setPadding('black');
  };

  const handleCancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onCancelPreview();
    onClose();
  };

  const handleApply = async () => {
    if (!originalImageData) { onClose(); return; }
    setApplying(true);
    const result = await runConvolution(
      originalImageData, kernel, divisor, channels, padding
    );
    setApplying(false);
    if (result) onApply(result);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="bg-[#22232b] text-[#c9cad1] rounded-lg shadow-2xl border border-[#32333f] p-0"
      style={{ minWidth: '400px', maxWidth: '90vw' }}
    >
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#32333f]">
        <span className="text-xs font-bold tracking-widest uppercase text-[#9496a8]">
          Фильтр (свёртка)
        </span>
        <button onClick={handleCancel}
          className="text-[#5a5c70] hover:text-[#c9cad1] transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-[#32333f]">
          ✕
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">

        {/* Пресеты */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider w-20 shrink-0">
            Пресет
          </span>
          <select
            value={preset}
            onChange={e => handlePresetChange(e.target.value)}
            className="flex-1 bg-[#1a1b22] border border-[#3a3b47] rounded px-2 py-1 text-xs text-[#c9cad1] outline-none cursor-pointer"
          >
            {Object.entries(PRESETS).map(([key, p]) => (
              <option key={key} value={key}>{p.label}</option>
            ))}
            {preset === 'custom' && (
              <option value="custom">Пользовательский</option>
            )}
          </select>
        </div>

        {/* Сетка ядра 3×3 */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider">
            Ядро 3×3
          </span>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
          >
            {kernel.map((val, i) => (
              <input
                key={i}
                type="number"
                value={val}
                onChange={e => handleKernelChange(i, e.target.value)}
                className="bg-[#1a1b22] border border-[#3a3b47] rounded px-2 py-1.5 text-xs text-[#c9cad1] outline-none text-center tabular-nums focus:border-[#7c7f96] transition-colors"
                style={{ width: '100%' }}
              />
            ))}
          </div>

          {/* Делитель */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[#5a5c70] w-20 shrink-0">Делитель</span>
            <input
              type="number"
              value={divisor}
              min={1}
              onChange={e => {
                const v = parseFloat(e.target.value);
                setDivisor(isNaN(v) || v === 0 ? 1 : v);
              }}
              className="w-20 bg-[#1a1b22] border border-[#3a3b47] rounded px-2 py-1 text-xs text-[#c9cad1] outline-none text-center"
            />
          </div>
        </div>

        {/* Каналы */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider w-20 shrink-0">
            Каналы
          </span>
          <div className="flex gap-2">
            {CHANNEL_LIST.map(({ key, label, color }) => (
              <label key={key} className="flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={channels[key]}
                  onChange={() => toggleChannel(key)}
                  className="cursor-pointer"
                  style={{ accentColor: color }}
                />
                <span className="text-xs" style={{ color: channels[key] ? color : '#5a5c70' }}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Стратегия края */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider w-20 shrink-0">
            Края
          </span>
          <select
            value={padding}
            onChange={e => setPadding(e.target.value)}
            className="flex-1 bg-[#1a1b22] border border-[#3a3b47] rounded px-2 py-1 text-xs text-[#c9cad1] outline-none cursor-pointer"
          >
            {Object.entries(PADDING_STRATEGIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
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
          disabled={applying}
          className="px-4 py-1.5 text-sm rounded bg-[#3a3b47] hover:bg-[#484a5a] text-[#e0e1ea] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {applying ? 'Обработка…' : 'Применить'}
        </button>
      </div>
    </dialog>
  );
}
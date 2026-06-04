import { useState, useEffect, useRef } from 'react';
import { resizeImage, INTERPOLATION_METHODS } from '../lib/interpolation';

export default function ResizeDialog({ isOpen, onClose, imageData, onApply }) {
  const dialogRef = useRef(null);

  const [unit,      setUnit]      = useState('px');   // 'px' | '%'
  const [width,     setWidth]     = useState('');
  const [height,    setHeight]    = useState('');
  const [linked,    setLinked]    = useState(true);
  const [method,    setMethod]    = useState('bilinear');
  const [errors,    setErrors]    = useState({});

  const origW = imageData?.width  || 1;
  const origH = imageData?.height || 1;
  const ratio = origW / origH;

  // Открываем диалог и заполняем начальные значения
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (isOpen) {
      setUnit('px');
      setWidth(String(origW));
      setHeight(String(origH));
      setLinked(true);
      setMethod('bilinear');
      setErrors({});
      if (!d.open) d.showModal();
    } else {
      if (d.open) d.close();
    }
  }, [isOpen, origW, origH]);

  // Вычисляем новые размеры в пикселях
  const getNewDimensions = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    if (unit === '%') {
      return {
        dw: Math.round(origW * w / 100),
        dh: Math.round(origH * h / 100),
      };
    }
    return { dw: Math.round(w), dh: Math.round(h) };
  };

  const { dw, dh } = (() => {
    try { return getNewDimensions(); }
    catch { return { dw: origW, dh: origH }; }
  })();

  const origMP = (origW * origH / 1_000_000).toFixed(2);
  const newMP  = (dw * dh / 1_000_000).toFixed(2);

  // Изменение ширины
  const handleWidthChange = (val) => {
    setWidth(val);
    if (linked) {
      const w = parseFloat(val);
      if (!isNaN(w) && w > 0) {
        if (unit === 'px') {
          setHeight(String(Math.round(w / ratio)));
        } else {
          setHeight(val); // в % — одинаковые значения
        }
      }
    }
  };

  // Изменение высоты
  const handleHeightChange = (val) => {
    setHeight(val);
    if (linked) {
      const h = parseFloat(val);
      if (!isNaN(h) && h > 0) {
        if (unit === 'px') {
          setWidth(String(Math.round(h * ratio)));
        } else {
          setWidth(val);
        }
      }
    }
  };

  // Смена единиц
  const handleUnitChange = (newUnit) => {
    if (newUnit === unit) return;
    if (newUnit === '%') {
      // px → %
      const w = parseFloat(width);
      const h = parseFloat(height);
      setWidth(isNaN(w) ? '100' : String(Math.round(w / origW * 100)));
      setHeight(isNaN(h) ? '100' : String(Math.round(h / origH * 100)));
    } else {
      // % → px
      const w = parseFloat(width);
      const h = parseFloat(height);
      setWidth(isNaN(w)  ? String(origW) : String(Math.round(origW * w / 100)));
      setHeight(isNaN(h) ? String(origH) : String(Math.round(origH * h / 100)));
    }
    setUnit(newUnit);
    setErrors({});
  };

  // Валидация
  const validate = () => {
    const errs = {};
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (isNaN(w) || !Number.isFinite(w)) errs.width = 'Введите число';
    else if (w <= 0) errs.width = 'Должно быть больше 0';
    else if (unit === 'px' && (w < 1 || w > 8000)) errs.width = 'От 1 до 8000 пкс';
    else if (unit === '%' && (w < 1 || w > 1000)) errs.width = 'От 1 до 1000%';

    if (isNaN(h) || !Number.isFinite(h)) errs.height = 'Введите число';
    else if (h <= 0) errs.height = 'Должно быть больше 0';
    else if (unit === 'px' && (h < 1 || h > 8000)) errs.height = 'От 1 до 8000 пкс';
    else if (unit === '%' && (h < 1 || h > 1000)) errs.height = 'От 1 до 1000%';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleApply = () => {
    if (!validate()) return;
    const { dw, dh } = getNewDimensions();
    const result = resizeImage(imageData, dw, dh, method);
    onApply(result);
  };

  const selectedMethod = INTERPOLATION_METHODS[method];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="bg-[#22232b] text-[#c9cad1] rounded-lg shadow-2xl border border-[#32333f] p-0"
      style={{ minWidth: '360px', maxWidth: '90vw' }}
    >
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#32333f]">
        <span className="text-xs font-bold tracking-widest uppercase text-[#9496a8]">
          Изменить размер
        </span>
        <button
          onClick={onClose}
          className="text-[#5a5c70] hover:text-[#c9cad1] transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-[#32333f]"
        >
          ✕
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">

        {/* Мегапиксели до/после */}
        <div className="flex gap-4 text-xs bg-[#1a1b22] rounded p-3 border border-[#2e2f3a]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[#5a5c70] text-[10px] uppercase tracking-wider">До</span>
            <span className="text-[#9496a8] tabular-nums">{origW} × {origH} пкс</span>
            <span className="text-[#6b6e85] tabular-nums">{origMP} МП</span>
          </div>
          <div className="w-px bg-[#2e2f3a]" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[#5a5c70] text-[10px] uppercase tracking-wider">После</span>
            <span className="text-[#9496a8] tabular-nums">{dw} × {dh} пкс</span>
            <span className="text-[#6b6e85] tabular-nums">{newMP} МП</span>
          </div>
        </div>

        {/* Единицы измерения */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider w-20 shrink-0">
            Единицы
          </span>
          <div className="flex gap-1">
            {['px', '%'].map(u => (
              <button
                key={u}
                onClick={() => handleUnitChange(u)}
                className="px-3 py-1 text-xs rounded border transition-colors"
                style={{
                  borderColor: unit === u ? '#9496a8' : '#3a3b47',
                  color:       unit === u ? '#f0f0f5' : '#5a5c70',
                  background:  unit === u ? '#32334a' : 'transparent',
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Ширина */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider w-20 shrink-0">
              Ширина
            </span>
            <input
              type="number"
              value={width}
              onChange={e => handleWidthChange(e.target.value)}
              className="flex-1 bg-[#1a1b22] border rounded px-2 py-1 text-xs text-[#c9cad1] outline-none"
              style={{ borderColor: errors.width ? '#c05555' : '#3a3b47' }}
            />
            <span className="text-[10px] text-[#5a5c70] w-6">{unit}</span>
          </div>
          {errors.width && (
            <span className="text-[10px] text-[#c05555] ml-24">{errors.width}</span>
          )}
        </div>

        {/* Высота + чекбокс пропорций */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider w-20 shrink-0">
              Высота
            </span>
            <input
              type="number"
              value={height}
              onChange={e => handleHeightChange(e.target.value)}
              className="flex-1 bg-[#1a1b22] border rounded px-2 py-1 text-xs text-[#c9cad1] outline-none"
              style={{ borderColor: errors.height ? '#c05555' : '#3a3b47' }}
            />
            <span className="text-[10px] text-[#5a5c70] w-6">{unit}</span>
          </div>
          {errors.height && (
            <span className="text-[10px] text-[#c05555] ml-24">{errors.height}</span>
          )}
        </div>

        {/* Сохранять пропорции */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={linked}
            onChange={e => setLinked(e.target.checked)}
            className="accent-[#7c7f96] cursor-pointer"
          />
          <span className="text-xs text-[#7c7f96]">Сохранять пропорции</span>
        </label>

        {/* Метод интерполяции */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#5a5c70] uppercase tracking-wider w-20 shrink-0">
              Метод
            </span>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="flex-1 bg-[#1a1b22] border border-[#3a3b47] rounded px-2 py-1 text-xs text-[#c9cad1] outline-none cursor-pointer"
            >
              {Object.entries(INTERPOLATION_METHODS).map(([key, m]) => (
                <option key={key} value={key}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Тултип с описанием метода */}
          {selectedMethod && (
            <div className="ml-24 text-[10px] text-[#5a5c70] bg-[#1a1b22] rounded px-2 py-1.5 border border-[#2e2f3a] leading-relaxed">
              {selectedMethod.tooltip}
            </div>
          )}
        </div>

      </div>

      {/* Футер */}
      <div className="flex gap-2 justify-end px-4 py-3 border-t border-[#32333f]">
        <button
          onClick={onClose}
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
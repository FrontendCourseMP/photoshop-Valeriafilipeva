import { useRef, useCallback } from 'react';

// Три маркера под гистограммой: чёрная точка, гамма, белая точка
export default function LevelsSlider({ black, gamma, white, onChange }) {
  const trackRef = useRef(null);

  // Преобразует позицию гаммы (0-255) в реальное значение (0.1-9.9)
  // Гамма 1.0 = середина между black и white
  const gammaToPos = (g, b, w) => {
    // Логарифмическая шкала: gamma=1 → середина
    const mid = (b + w) / 2;
    if (g === 1.0) return mid;
    // Позиция на шкале 0-255
    const logG = Math.log(g);
    const range = w - b;
    return Math.round(b + range * (0.5 - logG / (2 * Math.log(10))));
  };

  const posToGamma = (pos, b, w) => {
    const range = w - b;
    if (range === 0) return 1.0;
    const ratio = (pos - b) / range; // 0..1
    // ratio=0.5 → gamma=1, ratio<0.5 → gamma>1 (светлее), ratio>0.5 → gamma<1 (темнее)
    const g = Math.pow(10, (0.5 - ratio) * 2);
    return Math.max(0.1, Math.min(9.9, Math.round(g * 100) / 100));
  };

  const getPos = useCallback((e) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    return Math.round(Math.max(0, Math.min(255, ratio * 255)));
  }, []);

  const handleBlackChange = (e) => {
    const val = Math.min(Number(e.target.value), white - 1);
    onChange({ black: val, gamma, white });
  };

  const handleWhiteChange = (e) => {
    const val = Math.max(Number(e.target.value), black + 1);
    onChange({ black, gamma, white: val });
  };

  const handleGammaChange = (e) => {
    const pos = Number(e.target.value);
    const g = posToGamma(pos, black, white);
    onChange({ black, gamma: g, white });
  };

  // Позиция гаммы для слайдера (0-255)
  const gammaPos = gammaToPos(gamma, black, white);

  return (
    <div className="flex flex-col gap-2">
      {/* Градиент под гистограммой */}
      <div
        className="w-full h-3 rounded"
        style={{
          background: 'linear-gradient(to right, #000, #fff)',
          position: 'relative',
        }}
      />

      {/* Слайдер чёрной точки */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#5a5c70] w-16">Чёрная</span>
        <input
          type="range" min={0} max={254}
          value={black}
          onChange={handleBlackChange}
          className="flex-1 accent-[#555]"
        />
        <span className="text-[10px] text-[#9496a8] w-8 text-right">{black}</span>
      </div>

      {/* Слайдер гаммы */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#5a5c70] w-16">Гамма</span>
        <input
          type="range" min={black} max={white}
          value={gammaPos}
          onChange={handleGammaChange}
          className="flex-1 accent-[#7c7f96]"
        />
        <span className="text-[10px] text-[#9496a8] w-8 text-right">{gamma.toFixed(2)}</span>
      </div>

      {/* Слайдер белой точки */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#5a5c70] w-16">Белая</span>
        <input
          type="range" min={1} max={255}
          value={white}
          onChange={handleWhiteChange}
          className="flex-1 accent-[#aaa]"
        />
        <span className="text-[10px] text-[#9496a8] w-8 text-right">{white}</span>
      </div>
    </div>
  );
}
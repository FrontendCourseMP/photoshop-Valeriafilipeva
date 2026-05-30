export default function LevelsSlider({ black, gamma, white, onChange }) {
  // Гамма-позиция: середина = 1.0, влево > 1.0 (светлее), вправо < 1.0 (темнее)
  const gammaToPos = (g, b, w) => {
    const range = w - b;
    if (range === 0) return Math.round((b + w) / 2);
    // log10(gamma) линейно от -1 до 1, середина = 0
    const logG = Math.log10(Math.max(0.1, Math.min(9.9, g)));
    // logG: -1..+1 → pos: w..b (инверсия: больше гамма = левее)
    const ratio = 0.5 - logG / 2;
    return Math.round(b + range * ratio);
  };

  const posToGamma = (pos, b, w) => {
    const range = w - b;
    if (range === 0) return 1.0;
    const ratio = (pos - b) / range; // 0..1
    const logG = (0.5 - ratio) * 2;  // +1..-1
    const g = Math.pow(10, logG);
    return Math.max(0.1, Math.min(9.9, Math.round(g * 100) / 100));
  };

  const handleBlackChange = (e) => {
    const val = Math.min(Number(e.target.value), white - 1);
    onChange({ black: val, gamma, white });
  };

  const handleWhiteChange = (e) => {
    const val = Math.max(Number(e.target.value), black + 1);
    onChange({ black, gamma, white: val });
  };

  const handleGammaChange = (e) => {
    const g = posToGamma(Number(e.target.value), black, white);
    onChange({ black, gamma: g, white });
  };

  const gammaPos = gammaToPos(gamma, black, white);

  return (
    <div className="flex flex-col gap-3">
      {/* Градиент */}
      <div className="w-full h-2 rounded" style={{
        background: 'linear-gradient(to right, #000, #fff)'
      }} />

      {/* Чёрная точка */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#5a5c70] w-16 shrink-0">Чёрная</span>
        <input
          type="range" min={0} max={254}
          value={black}
          onChange={handleBlackChange}
          className="flex-1 accent-[#666]"
        />
        <span className="text-[10px] text-[#9496a8] w-8 text-right tabular-nums">
          {black}
        </span>
      </div>

      {/* Гамма */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#5a5c70] w-16 shrink-0">Гамма</span>
        <input
          type="range"
          min={black}
          max={white}
          value={gammaPos}
          onChange={handleGammaChange}
          className="flex-1 accent-[#7c7f96]"
        />
        <span className="text-[10px] text-[#9496a8] w-8 text-right tabular-nums">
          {gamma.toFixed(2)}
        </span>
      </div>

      {/* Белая точка */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#5a5c70] w-16 shrink-0">Белая</span>
        <input
          type="range" min={1} max={255}
          value={white}
          onChange={handleWhiteChange}
          className="flex-1 accent-[#bbb]"
        />
        <span className="text-[10px] text-[#9496a8] w-8 text-right tabular-nums">
          {white}
        </span>
      </div>
    </div>
  );
}
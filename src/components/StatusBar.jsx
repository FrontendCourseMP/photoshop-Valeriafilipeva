export default function StatusBar({ imageInfo, scale, onScaleChange }) {
  if (!imageInfo) {
    return (
      <div className="flex items-center h-7 px-4 bg-[#1a1b22] border-t border-[#2e2f3a] text-[#3a3b47] text-xs shrink-0">
        Изображение не загружено
      </div>
    );
  }

  const { width, height, colorDepth, fileName } = imageInfo;
  const pct = Math.round(scale * 100);

  const handleScaleInput = (e) => {
    const val = Math.max(12, Math.min(300, Number(e.target.value)));
    onScaleChange(val / 100);
  };

  return (
    <div className="flex items-center gap-4 h-7 px-4 bg-[#1a1b22] border-t border-[#2e2f3a] text-xs text-[#6b6e85] shrink-0">

      <span className="text-[#9496a8] max-w-[180px] truncate shrink-0">{fileName}</span>

      <span className="shrink-0">{width} × {height} пкс</span>
      <span className="shrink-0">{colorDepth}-бит</span>

      {/* Слайдер масштаба */}
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="range"
          min={12} max={300} step={1}
          value={pct}
          onChange={handleScaleInput}
          className="w-20 accent-[#7c7f96]"
        />
        <span className="w-10 text-right tabular-nums text-[#9496a8]">{pct}%</span>
      </div>

      <span className="ml-auto shrink-0">
        {(width * height / 1_000_000).toFixed(2)} МП
      </span>
    </div>
  );
}
export default function StatusBar({ imageInfo, scale }) {
  if (!imageInfo) {
    return (
      <div className="flex items-center h-7 px-4 bg-[#1a1b22] border-t border-[#2e2f3a] text-[#3a3b47] text-xs shrink-0">
        Изображение не загружено
      </div>
    );
  }
  const { width, height, colorDepth, fileName } = imageInfo;
  return (
    <div className="flex items-center gap-5 h-7 px-4 bg-[#1a1b22] border-t border-[#2e2f3a] text-xs text-[#6b6e85] shrink-0">
      <span className="text-[#9496a8] max-w-[220px] truncate">{fileName}</span>
      <span>{width} × {height} пкс</span>
      <span>{colorDepth}-бит</span>
      <span>{Math.round(scale * 100)}%</span>
      <span className="ml-auto">{(width * height / 1_000_000).toFixed(2)} МП</span>
    </div>
  );
}
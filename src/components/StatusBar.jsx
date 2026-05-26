export default function StatusBar({ imageInfo, scale }) {
  if (!imageInfo) {
    return (
      <div className="flex items-center h-6 px-4 bg-[#111113] border-t border-[#27272a] text-[#3f3f46] text-xs">
        No image loaded
      </div>
    );
  }
  const { width, height, colorDepth, fileName } = imageInfo;
  return (
    <div className="flex items-center gap-5 h-6 px-4 bg-[#111113] border-t border-[#27272a] text-xs text-[#71717a]">
      <span className="text-[#a1a1aa] max-w-[200px] truncate">{fileName}</span>
      <span>{width} × {height} px</span>
      <span>{colorDepth}-bit</span>
      <span>{Math.round(scale * 100)}%</span>
      <span className="ml-auto">{(width * height / 1_000_000).toFixed(2)} MP</span>
    </div>
  );
}
import { useEffect, useRef } from 'react';

export default function Canvas({ displayImageData, scale, onScaleChange }) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  // Храним "ключ" чтобы перезапускать анимацию при новом изображении
  const animKeyRef   = useRef(0);

  // Рисуем при изменении displayImageData
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !displayImageData) return;

    canvas.width  = displayImageData.width;
    canvas.height = displayImageData.height;
    canvas.getContext('2d').putImageData(displayImageData, 0, 0);
  }, [displayImageData]);

  // Автомасштаб при первой загрузке нового изображения
  useEffect(() => {
    if (!displayImageData || !containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const { width, height } = displayImageData;
    const pad = 100;
    const s = Math.min((clientWidth - pad) / width, (clientHeight - pad) / height, 3.0);
    onScaleChange(Math.max(0.12, s));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayImageData?.width, displayImageData?.height]);

  // Скролл колёсиком — зум
  const handleWheel = (e) => {
    if (!displayImageData) return;
    e.preventDefault();
    onScaleChange(prev => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      return Math.max(0.12, Math.min(3.0, prev * delta));
    });
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden checkerboard relative"
      onWheel={handleWheel}
    >
      {!displayImageData ? (
        <div className="flex flex-col items-center gap-3 text-[#3f3f46] select-none pointer-events-none">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="6" y="10" width="36" height="28" rx="3"/>
            <circle cx="18" cy="21" r="4"/>
            <polyline points="6,32 15,22 22,30 30,20 42,32"/>
          </svg>
          <span className="text-sm">Open an image to begin</span>
          <span className="text-xs tracking-widest">PNG · JPG · GB7</span>
        </div>
      ) : (
        <canvas
          key={`${displayImageData.width}x${displayImageData.height}`}
          ref={canvasRef}
          className="canvas-appear shadow-2xl"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            imageRendering: scale > 2 ? 'pixelated' : 'auto',
          }}
        />
      )}
    </div>
  );
}
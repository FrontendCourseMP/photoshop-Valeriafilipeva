import { useEffect, useRef, useState, useCallback } from 'react';

export default function Canvas({ displayImageData, scale, onScaleChange }) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading]   = useState(false);
  const [visible, setVisible]   = useState(false);
  const renderTaskRef = useRef(null); // отменяем предыдущий рендер

  const drawToCanvas = useCallback((imageData) => {
    // Отменяем предыдущую задачу если она ещё не выполнилась
    if (renderTaskRef.current) {
      cancelAnimationFrame(renderTaskRef.current);
      renderTaskRef.current = null;
    }

    setVisible(false);
    setLoading(true);

    // Даём браузеру один кадр чтобы показать лоадер
    renderTaskRef.current = requestAnimationFrame(() => {
      renderTaskRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) { setLoading(false); return; }

        // Если нет данных — просто очищаем
        if (!imageData) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.width = 1;
          canvas.height = 1;
          setLoading(false);
          setVisible(false);
          return;
        }

        canvas.width  = imageData.width;
        canvas.height = imageData.height;
        canvas.getContext('2d').putImageData(imageData, 0, 0);

        setLoading(false);
        setVisible(true);
        renderTaskRef.current = null;
      });
    });
  }, []);

  // Перерисовка при смене данных
  useEffect(() => {
    drawToCanvas(displayImageData);
    return () => {
      if (renderTaskRef.current) {
        cancelAnimationFrame(renderTaskRef.current);
      }
    };
  }, [displayImageData, drawToCanvas]);

  // Автомасштаб + ResizeObserver
  useEffect(() => {
    if (!displayImageData || !containerRef.current) return;

    const calcScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const { width, height } = displayImageData;
      const pad = 80;
      const s = Math.min(
        (clientWidth  - pad) / width,
        (clientHeight - pad) / height,
        3.0
      );
      onScaleChange(Math.max(0.12, Math.min(3.0, s)));
    };

    calcScale();
    const ro = new ResizeObserver(calcScale);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayImageData?.width, displayImageData?.height]);

  // Зум колёсиком
  const handleWheel = (e) => {
    if (!displayImageData) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    onScaleChange(prev => Math.max(0.12, Math.min(3.0, prev * delta)));
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden checkerboard relative"
      onWheel={handleWheel}
    >
      {/* Пустое состояние */}
      {!displayImageData && !loading && (
        <div className="flex flex-col items-center gap-3 text-[#44465a] select-none pointer-events-none">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="7" y="11" width="38" height="30" rx="3"/>
            <circle cx="19" cy="23" r="4"/>
            <polyline points="7,35 17,24 24,32 32,21 45,35"/>
          </svg>
          <span className="text-sm tracking-wide">Откройте изображение</span>
          <span className="text-xs tracking-widest opacity-60">PNG · JPG · GB7</span>
        </div>
      )}

      {/* Лоадер */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#6b6e85] z-10 bg-[#23242a]/60">
          <div className="loader" />
          <span className="text-xs tracking-widest">Загрузка…</span>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="shadow-xl"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          imageRendering: scale > 2 ? 'pixelated' : 'auto',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />
    </div>
  );
}
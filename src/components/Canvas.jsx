import { useEffect, useRef, useState, useCallback } from "react";
import { rgbToLab } from "../lib/colorSpaces";
import EyedropperInfo from "./EyedropperInfo";

export default function Canvas({
  displayImageData,
  scale,
  onScaleChange,
  activeTool,
  onPickPixel,
  pickedPixel,
  onClearPick,
}) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const drawToCanvas = useCallback((imageData) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setVisible(false);
    setLoading(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        timerRef.current = setTimeout(() => {
          const canvas = canvasRef.current;
          if (!canvas) { setLoading(false); return; }

          if (!imageData) {
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 1; canvas.height = 1;
            setLoading(false); setVisible(false);
            return;
          }

          canvas.width  = imageData.width;
          canvas.height = imageData.height;
          canvas.getContext("2d").putImageData(imageData, 0, 0);
          setLoading(false);
          setVisible(true);
        }, 50);
      });
    });
  }, []);

  useEffect(() => {
    drawToCanvas(displayImageData);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [displayImageData, drawToCanvas]);

  // Автомасштаб + ResizeObserver
  useEffect(() => {
    if (!displayImageData || !containerRef.current) return;
    const calcScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const { width, height } = displayImageData;
      const s = Math.min((clientWidth - 80) / width, (clientHeight - 80) / height, 3.0);
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
    onScaleChange((prev) => Math.max(0.12, Math.min(3.0, prev * delta)));
  };

  // Пипетка — клик по canvas
  const handleCanvasClick = (e) => {
    if (activeTool !== 'eyedropper') return;
    const canvas = canvasRef.current;
    if (!canvas || !displayImageData) return;

    // Вычисляем реальные координаты с учётом CSS масштаба
    const rect = canvas.getBoundingClientRect();
    // getBoundingClientRect возвращает CSS-размер (уже с scale)
    const cssW = rect.width;
    const cssH = rect.height;
    const realW = canvas.width;
    const realH = canvas.height;

    const scaleX = realW / cssW;
    const scaleY = realH / cssH;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top)  * scaleY);

    // Зажимаем в границы
    const cx = Math.max(0, Math.min(realW - 1, x));
    const cy = Math.max(0, Math.min(realH - 1, y));

    const idx = (cy * realW + cx) * 4;
    const d = displayImageData.data;
    const r = d[idx], g = d[idx+1], b = d[idx+2], a = d[idx+3];
    const lab = rgbToLab(r, g, b);

    onPickPixel({ x: cx, y: cy, r, g, b, a, lab });
  };

  const isEyedropper = activeTool === 'eyedropper';

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden checkerboard relative"
      onWheel={handleWheel}
      style={{ cursor: isEyedropper ? 'crosshair' : 'default' }}
    >
      {/* Пустое состояние */}
      {!displayImageData && !loading && (
        <div className="flex flex-col items-center gap-4 select-none pointer-events-none">
          <svg width="64" height="64" viewBox="0 0 52 52" fill="none"
               stroke="#6b6e85" strokeWidth="1.2" strokeLinecap="round">
            <rect x="7" y="11" width="38" height="30" rx="3"/>
            <circle cx="19" cy="23" r="4"/>
            <polyline points="7,35 17,24 24,32 32,21 45,35"/>
          </svg>
          <span style={{ fontSize: "16px", letterSpacing: "0.05em", color: "#9496a8" }}>
            Откройте изображение
          </span>
          <span style={{ fontSize: "12px", letterSpacing: "0.15em", color: "#5a5c70" }}>
            PNG · JPG · GB7
          </span>
        </div>
      )}

      {/* Лоадер */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20"
             style={{ background: "rgba(35,36,42,0.85)" }}>
          <div className="loader" />
          <span style={{ fontSize: "12px", letterSpacing: "0.15em", color: "#9496a8" }}>
            Загрузка…
          </span>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="shadow-xl"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          imageRendering: scale > 2 ? "pixelated" : "auto",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s ease",
          pointerEvents: visible ? "auto" : "none",
        }}
      />

      {/* Всплывашка пипетки */}
      {pickedPixel && (
        <EyedropperInfo pixel={pickedPixel} onClose={onClearPick} />
      )}
    </div>
  );
}
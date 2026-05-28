import { useEffect, useRef } from 'react';
import { calcHistogram } from '../lib/levels';

export default function Histogram({ imageData, channel, logScale }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Фон
    ctx.fillStyle = '#16171e';
    ctx.fillRect(0, 0, W, H);

    const hist = calcHistogram(imageData, channel);

    // Максимум для нормализации
    const maxVal = logScale
      ? Math.log(Math.max(...hist) + 1)
      : Math.max(...hist);

    if (maxVal === 0) return;

    // Цвет столбцов зависит от канала
    const colors = {
      master: '#7c7f96',
      R: '#c05555',
      G: '#55a855',
      B: '#5577c0',
      A: '#888888',
    };
    ctx.fillStyle = colors[channel] || '#7c7f96';

    const barW = W / 256;

    for (let i = 0; i < 256; i++) {
      const val = logScale ? Math.log(hist[i] + 1) : hist[i];
      const barH = (val / maxVal) * H;
      ctx.fillRect(i * barW, H - barH, barW + 0.5, barH);
    }

    // Сетка
    ctx.strokeStyle = '#2e2f3a';
    ctx.lineWidth = 1;
    for (let x = 64; x < 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x * barW, 0);
      ctx.lineTo(x * barW, H);
      ctx.stroke();
    }
  }, [imageData, channel, logScale]);

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={80}
      className="w-full rounded"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
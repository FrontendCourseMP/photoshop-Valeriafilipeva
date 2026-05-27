// Всплывашка с данными пипетки

export default function EyedropperInfo({ pixel, onClose }) {
  if (!pixel) return null;

  const { x, y, r, g, b, a, lab } = pixel;

  return (
    <div
      className="absolute bottom-8 right-2 z-30 rounded-lg shadow-2xl overflow-hidden"
      style={{
        background: '#1a1b22',
        border: '1px solid #2e2f3a',
        minWidth: '200px',
      }}
    >
      {/* Шапка с цветом */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2e2f3a]">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded shadow-inner"
            style={{
              background: `rgba(${r},${g},${b},${a/255})`,
              border: '1px solid #3a3b47',
            }}
          />
          <span className="text-[10px] tracking-widest uppercase text-[#5a5c70]">
            Пипетка
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#3a3b47] hover:text-[#9496a8] transition-colors text-xs"
        >
          ✕
        </button>
      </div>

      <div className="px-3 py-2 flex flex-col gap-1.5 text-xs font-mono">
        {/* Координаты */}
        <Row label="X / Y" value={`${x}, ${y}`} />

        <div className="border-t border-[#2e2f3a] my-1" />

        {/* RGB */}
        <Row label="R" value={r} color="#e05555" />
        <Row label="G" value={g} color="#55c455" />
        <Row label="B" value={b} color="#5588e0" />
        <Row label="A" value={a} color="#aaaaaa" />

        <div className="border-t border-[#2e2f3a] my-1" />

        {/* HEX */}
        <Row
          label="HEX"
          value={`#${[r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')}`}
        />

        <div className="border-t border-[#2e2f3a] my-1" />

        {/* CIELAB */}
        <Row label="L*"  value={lab.L} />
        <Row label="a*"  value={lab.a} />
        <Row label="b*"  value={lab.b} />
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ color: color || '#5a5c70', minWidth: '28px' }}>{label}</span>
      <span style={{ color: '#c9cad1' }}>{value}</span>
    </div>
  );
}
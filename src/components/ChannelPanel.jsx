// Панель каналов — лаб 2
const CHANNELS = [
  { key: 'R', label: 'Красный', color: '#e05555' },
  { key: 'G', label: 'Зелёный', color: '#55c455' },
  { key: 'B', label: 'Синий',   color: '#5588e0' },
  { key: 'A', label: 'Альфа',   color: '#aaaaaa' },
];

export default function ChannelPanel({
  imageData,
  enabledChannels,
  onToggle,
  channelThumbs,
}) {
  if (!imageData) return null;

  return (
    <div className="flex flex-col w-[130px] shrink-0 bg-[#1a1b22] border-l border-[#2e2f3a] overflow-y-auto">
      <div className="px-3 py-2 border-b border-[#2e2f3a]">
        <span className="text-[10px] tracking-widest uppercase text-[#5a5c70]">
          Каналы
        </span>
      </div>

      <div className="flex flex-col gap-1 p-2">
        {CHANNELS.map(({ key, label, color }) => {
          const enabled = enabledChannels[key];
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className="flex flex-col items-center gap-1 p-1.5 rounded transition-all"
              style={{
                background: enabled ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: `1px solid ${enabled ? color + '66' : '#2e2f3a'}`,
                opacity: enabled ? 1 : 0.4,
              }}
            >
              {/* Миниатюра канала */}
              <div
                className="w-full rounded overflow-hidden flex items-center justify-center"
                style={{
                  height: '60px',
                  background: '#111',
                }}
              >
                {channelThumbs[key] ? (
                  <img
                    src={channelThumbs[key]}
                    alt={label}
                    className="max-w-full max-h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#222]" />
                )}
              </div>

              {/* Название и индикатор */}
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: enabled ? color : '#444' }}
                />
                <span className="text-[10px]" style={{ color: enabled ? '#c9cad1' : '#5a5c70' }}>
                  {label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Подсказка */}
      <div className="px-3 py-2 mt-auto border-t border-[#2e2f3a]">
        <span className="text-[9px] text-[#3a3b47] leading-tight block">
          Нажмите на канал чтобы включить или выключить
        </span>
      </div>
    </div>
  );
}
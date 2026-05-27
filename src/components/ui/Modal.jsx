import { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (isOpen) d.showModal(); else d.close();
  }, [isOpen]);

  return (
    <dialog ref={ref} onClose={onClose}
      className="bg-[#22232b] text-[#c9cad1] rounded-lg min-w-[400px] max-w-[90vw] shadow-2xl border border-[#32333f]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#32333f]">
        <span className="text-xs font-bold tracking-widest uppercase text-[#9496a8]">{title}</span>
        <button onClick={onClose}
          className="text-[#5a5c70] hover:text-[#c9cad1] transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-[#32333f]">
          ✕
        </button>
      </div>
      <div className="p-4">{children}</div>
      {footer && (
        <div className="flex gap-2 justify-end px-4 py-3 border-t border-[#32333f]">{footer}</div>
      )}
    </dialog>
  );
}
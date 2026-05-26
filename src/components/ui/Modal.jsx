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
      className="bg-[#1f1f23] text-[#d4d4d8] rounded-lg min-w-[380px] max-w-[90vw] shadow-2xl border border-[#3f3f46]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3f3f46]">
        <span className="text-xs font-bold tracking-widest uppercase text-[#a1a1aa]">{title}</span>
        <button onClick={onClose} className="text-[#71717a] hover:text-[#f4f4f5] transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-[#3f3f46]">✕</button>
      </div>
      <div className="p-4">{children}</div>
      {footer && (
        <div className="flex gap-2 justify-end px-4 py-3 border-t border-[#3f3f46]">{footer}</div>
      )}
    </dialog>
  );
}
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-10 max-md:p-4 max-md:items-end overflow-y-auto" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-[90%] max-w-[580px] max-h-[85vh] flex flex-col shadow-card-xl animate-modal-in max-md:w-full max-md:max-h-[90vh] max-md:rounded-t-xl max-md:rounded-b-none max-md:animate-modal-slide-up m-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-7 py-6 border-b border-border max-md:px-5 max-md:py-5">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button className="bg-muted border-none text-text-muted w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer hover:bg-border hover:text-text-primary" onClick={onClose}>✕</button>
        </div>
        <div className="flex-1 p-7 overflow-y-auto max-md:p-5">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

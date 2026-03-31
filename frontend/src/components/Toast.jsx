import { useEffect } from 'react';

import { CircleCheck, XCircle } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-8 right-8 z-[3000] px-5 py-3.5 rounded-[10px] text-sm font-medium flex items-center gap-2.5 shadow-card-xl animate-slide-up max-w-[calc(100vw-32px)] max-md:top-auto max-md:bottom-4 max-md:right-4 max-md:left-4 ${type === 'success' ? 'bg-emerald-950 text-emerald-50 border-l-4 border-l-emerald-500' : 'bg-red-950 text-red-50 border-l-4 border-l-red-500'}`}>
      <span className="flex items-center gap-2">{type === 'success' ? <CircleCheck size={16} /> : <XCircle size={16} />} {message}</span>
      <button className="bg-transparent border-none text-inherit cursor-pointer text-lg leading-none opacity-70 hover:opacity-100" onClick={onClose}>✕</button>
    </div>
  );
}

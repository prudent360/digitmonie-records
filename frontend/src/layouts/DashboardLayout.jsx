import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('dm_user') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('dm_token');
    if (!token) navigate('/login', { replace: true });
  }, [navigate]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-body">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col ml-[260px] transition-[margin] duration-300 ease-in-out max-lg:ml-0 max-lg:pt-[60px]">
        {/* Mobile Header */}
        <header className="hidden max-lg:flex fixed top-0 left-0 right-0 h-[60px] bg-slate-900 z-50 items-center justify-between px-5 shadow-card-md max-sm:px-3 max-sm:h-14">
          <button className="hidden max-lg:flex w-11 h-11 items-center justify-center bg-white/[0.06] border border-white/10 rounded-[10px] text-white text-[22px] cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-base">💎</div>
            <div>
              <span className="text-base font-semibold text-white">DigitMonie</span>
              <span className="block text-[10px] text-blue-400 -mt-0.5">Records</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center text-sm font-semibold">
            {user.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        </header>
        <main className="max-w-[1200px] mx-auto w-full px-9 py-10 animate-slide-up max-lg:px-5 max-lg:py-7 max-md:px-4 max-md:py-5 max-md:pb-[100px] max-sm:px-3 max-sm:py-4 max-sm:pb-[100px]">
          <Outlet />
        </main>

        {/* Floating Action Button for Mobile */}
        {user.role !== 'viewer' && (
          <button className="hidden max-md:flex fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 text-white border-none text-[28px] font-light shadow-[0_6px_20px_rgba(2,132,199,0.35)] z-[90] cursor-pointer items-center justify-center transition-all duration-200 hover:bg-primary-700 hover:scale-[1.08] active:scale-95" onClick={() => navigate('/loans/new')}>+</button>
        )}
      </div>
    </div>
  );
}

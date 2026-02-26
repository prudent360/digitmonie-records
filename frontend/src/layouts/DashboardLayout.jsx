import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('dm_token');
    if (!token) navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        {/* Mobile Header */}
        <header className="dashboard-topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, background: 'var(--primary-500)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💎</div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>DigitMonie</span>
              <span style={{ display: 'block', fontSize: 10, color: '#60a5fa', marginTop: -2 }}>Records</span>
            </div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(59,130,246,0.3)', color: '#93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>A</div>
        </header>
        <main className="dashboard-content animate-in">
          <Outlet />
        </main>

        {/* Floating Action Button for Mobile */}
        <button className="fab" onClick={() => navigate('/loans/new')}>+</button>
      </div>
    </div>
  );
}

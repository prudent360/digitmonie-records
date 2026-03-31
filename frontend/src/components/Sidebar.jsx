import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  PlusCircle, 
  ClipboardList, 
  ShieldCheck,
  LogOut,
  Settings,
  Gem
} from 'lucide-react';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/loans', label: 'Loans', icon: Wallet },
  { to: '/loans/new', label: 'New Loan', icon: PlusCircle, manageOnly: true },
  { to: '/loan-types', label: 'Loan Types', icon: ClipboardList, manageOnly: true },
  { to: '/users', label: 'Users', icon: ShieldCheck, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('dm_user') || '{}');
  const logo = localStorage.getItem('dm_logo');

  const handleLogout = () => {
    localStorage.removeItem('dm_token');
    localStorage.removeItem('dm_user');
    navigate('/login');
  };

  return (
    <>
      {isOpen && <div className="hidden max-lg:block fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[99]" onClick={onClose}></div>}
      <aside className={`fixed top-0 left-0 w-[260px] h-screen bg-slate-900 flex flex-col z-[100] transition-transform duration-300 ease-in-out border-r border-white/[0.06] ${isOpen ? 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)]' : 'max-lg:-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-7">
          <span className="w-[38px] h-[38px] bg-white rounded-[10px] flex items-center justify-center text-lg text-slate-900 overflow-hidden">
            {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : <Gem size={20} />}
          </span>
          <div>
            <h1 className="text-xl font-bold text-white leading-none tracking-tight">DigitMonie</h1>
            <span className="text-[11px] text-white/35 font-medium block mt-[3px] tracking-wider uppercase">RECORDS</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-[10px] font-medium text-white/25 tracking-[0.08em] px-4 pt-4 pb-2 uppercase">MAIN MENU</div>
          {menuItems.filter(item => {
            if (item.adminOnly) return user.role === 'admin';
            if (item.manageOnly) return user.role !== 'viewer';
            return true;
          }).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all duration-200 ${isActive ? 'bg-primary-600 text-white shadow-[0_4px_12px_rgba(2,132,199,0.15)]' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}
              onClick={onClose}
            >
              <item.icon className={`shrink-0 opacity-60`} size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-white/[0.06] text-white flex items-center justify-center font-semibold text-[13px] border border-white/[0.08]">{user.name?.charAt(0) || 'A'}</div>
            <div>
              <div className="text-sm font-semibold text-white">{user.name || 'Admin'}</div>
              <div className="text-[11px] text-primary-400 font-medium uppercase tracking-wide">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Administrator'}</div>
            </div>
          </div>
          <button className="flex items-center gap-3 w-full px-4 py-2.5 border-none rounded-lg bg-transparent text-red-400 text-sm font-medium cursor-pointer hover:bg-red-500/[0.08]" onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

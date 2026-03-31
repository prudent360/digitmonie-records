import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, TrendingUp, BarChart3, Users, CircleCheck, Clock, AlertTriangle, Landmark, Gem } from 'lucide-react';
import api from '../lib/api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('dm_user') || '{"name": "Admin"}');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n || 0);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div></div>;

  const s = data?.stats || {};

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const StatCard = ({ icon: Icon, value, label, colorClasses }) => (
    <div className="bg-surface border border-border rounded-lg p-6 flex items-center gap-5 relative overflow-hidden transition-all duration-200 hover:shadow-card-md hover:border-primary-200 max-md:p-5 max-md:gap-4 max-sm:p-4 max-sm:gap-3.5">
      <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 max-md:w-[42px] max-md:h-[42px] max-sm:w-[38px] max-sm:h-[38px] max-sm:rounded-lg ${colorClasses}`}>
        <Icon size={22} className="max-md:w-[18px] max-md:h-[18px] max-sm:w-4 max-sm:h-4" />
      </div>
      <div className="min-w-0 relative z-[1] flex-1">
        <div className="text-lg font-bold text-text-primary tracking-tight leading-[1.3] break-words max-sm:text-base">{value}</div>
        <div className="text-[13px] text-text-muted font-medium mt-1 max-sm:text-xs">{label}</div>
      </div>
      <div className="absolute -top-2.5 -right-2.5 opacity-[0.06] pointer-events-none z-0 rotate-[15deg]">
        <Icon size={90} className="max-md:w-[60px] max-md:h-[60px]" />
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-[1.2] max-md:text-[22px] max-sm:text-xl">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1 max-sm:text-[13px]">Loan management overview</p>
        </div>
        {user.role !== 'viewer' && (
          <Link to="/loans/new" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-medium border-none transition-all duration-200 whitespace-nowrap bg-primary-600 text-white hover:bg-primary-700 hover:shadow-[0_4px_12px_rgba(2,132,199,0.2)] max-md:w-full max-md:min-h-[44px]">
            <span className="mr-2">+</span> New Loan
          </Link>
        )}
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 mb-8 border-none relative overflow-hidden rounded-xl animate-slide-up">
        <div className="relative z-[2]">
          <h2 className="text-white mb-2 text-[clamp(20px,5vw,28px)] font-extrabold tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}
          </h2>
          <p className="text-white/70 text-base font-medium">
            {user.role === 'admin' 
              ? "You have full administrative access. Manage your team and records below."
              : "Welcome back! Here's a quick overview of your loan records."
            }
          </p>
          
          {user.role === 'admin' && (
            <div className="flex gap-3 mt-6 max-md:flex-col">
              <Link to="/users" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-medium border-none transition-all duration-200 whitespace-nowrap bg-white text-slate-900 max-md:w-full max-md:min-h-[44px]">
                <Users size={16} className="mr-1" />
                Manage Team
              </Link>
              <Link to="/loans/new" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 whitespace-nowrap bg-white/10 text-white border border-white/20 max-md:w-full max-md:min-h-[44px]">
                New Loan Record
              </Link>
            </div>
          )}
        </div>
        <div className="absolute -right-5 -top-5 opacity-[0.08] pointer-events-none z-[1]">
          <Gem size={160} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-7 max-lg:grid-cols-2 max-md:gap-3 max-sm:grid-cols-1">
        <StatCard icon={Banknote} value={fmt(s.total_disbursed)} label="Total Disbursed" colorClasses="bg-purple-50 text-purple-500" />
        <StatCard icon={TrendingUp} value={fmt(s.total_profit)} label="Total Profit" colorClasses="bg-green-50 text-green-500" />
        <StatCard icon={BarChart3} value={s.active_loans || 0} label="Active Loans" colorClasses="bg-blue-50 text-blue-500" />
        <StatCard icon={Users} value={s.total_customers || 0} label="Total Customers" colorClasses="bg-amber-50 text-amber-500" />
      </div>

      <div className="grid grid-cols-4 gap-5 mb-7 max-lg:grid-cols-2 max-md:gap-3 max-sm:grid-cols-1">
        <StatCard icon={CircleCheck} value={fmt(s.total_collected)} label="Total Collected" colorClasses="bg-green-50 text-green-500" />
        <StatCard icon={Clock} value={fmt(s.total_pending)} label="Pending Payments" colorClasses="bg-amber-50 text-amber-500" />
        <StatCard icon={AlertTriangle} value={s.overdue_count || 0} label="Overdue Payments" colorClasses="bg-red-50 text-red-500" />
        <StatCard icon={Landmark} value={fmt(s.total_interest)} label="Total Interest Earned" colorClasses="bg-indigo-50 text-indigo-500" />
      </div>

      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        <div className="bg-surface border border-border rounded-lg p-7 max-md:p-5 max-sm:p-4">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border max-md:mb-4 max-md:pb-3">
            <h3 className="text-base font-semibold text-text-primary">Recent Loans</h3>
            <Link to="/loans" className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-[10px] text-[13px] font-medium transition-all duration-200 whitespace-nowrap bg-muted text-text-primary border border-border hover:bg-border">View All</Link>
          </div>
          {data?.recent_loans?.length > 0 ? (
            <div className="overflow-x-auto -mx-7 px-7 max-md:-mx-5 max-md:px-5">
              <table className="w-full border-collapse">
                <thead><tr>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Customer</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Amount</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Status</th>
                </tr></thead>
                <tbody>
                  {data.recent_loans.map((l) => (
                    <tr key={l.id} className="transition-all duration-200 hover:bg-muted">
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap"><Link to={`/loans/${l.id}`} className="text-text-primary font-medium">{l.customer_name}</Link></td>
                      <td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums">{fmt(l.principal_amount)}</td>
                      <td className="px-4 py-4 border-b border-border text-sm whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${l.status === 'active' || l.status === 'paid' ? 'bg-green-100 text-green-800' : l.status === 'completed' ? 'bg-primary-100 text-primary-800' : l.status === 'defaulted' || l.status === 'overdue' ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-800'}`}>{l.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface rounded-lg border border-dashed border-border"><p className="text-sm text-text-muted">No loans yet</p></div>}
        </div>

        <div className="bg-surface border border-border rounded-lg p-7 max-md:p-5 max-sm:p-4">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border max-md:mb-4 max-md:pb-3"><h3 className="text-base font-semibold text-text-primary">Upcoming Payments</h3></div>
          {data?.upcoming_repayments?.length > 0 ? (
            <div className="overflow-x-auto -mx-7 px-7 max-md:-mx-5 max-md:px-5">
              <table className="w-full border-collapse">
                <thead><tr>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Customer</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Amount</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Due Date</th>
                </tr></thead>
                <tbody>
                  {data.upcoming_repayments.map((r) => (
                    <tr key={r.id} className="transition-all duration-200 hover:bg-muted">
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap font-medium">{r.customer_name}</td>
                      <td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums">{fmt(r.amount_due)}</td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{new Date(r.due_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface rounded-lg border border-dashed border-border"><p className="text-sm text-text-muted">No upcoming payments</p></div>}
        </div>
      </div>
    </div>
  );
}

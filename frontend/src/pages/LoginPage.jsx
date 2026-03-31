import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem } from 'lucide-react';
import api from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    api.getSettings().then(res => {
      if (res.settings?.logo) {
        setLogo(res.settings.logo);
        localStorage.setItem('dm_logo', res.settings.logo);
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      api.setToken(res.token);
      localStorage.setItem('dm_user', JSON.stringify(res.admin));
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(14,165,233,0.1)_0%,rgba(14,165,233,0)_70%)] z-0"></div>
      
      <div className="relative z-[1] w-full max-w-[420px]">
        <div className="flex flex-col items-center gap-3 mb-12">
          <div className="w-[60px] h-[60px] bg-white rounded-[14px] flex items-center justify-center text-[28px] shadow-[0_10px_25px_rgba(0,0,0,0.2)] overflow-hidden">
            {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : <Gem size={28} className="text-slate-900" />}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">DigitMonie</h1>
        </div>
        <div className="bg-surface border border-border rounded-lg p-7">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold mb-1 text-text-primary">Welcome back</h2>
            <p className="text-sm text-text-muted">Sign in to your account to continue</p>
          </div>
          {error && <div className="bg-red-50 border border-red-100 text-red-900 px-4 py-3 rounded-[10px] text-sm font-semibold mb-6 flex items-center gap-2.5">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Email Address</label>
              <input className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-[10px] text-text-primary text-sm transition-all duration-200 min-h-[44px] focus:outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/10 placeholder:text-slate-400" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mb-5">
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Password</label>
              <input className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-[10px] text-text-primary text-sm transition-all duration-200 min-h-[44px] focus:outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/10 placeholder:text-slate-400" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-medium border-none transition-all duration-200 whitespace-nowrap bg-primary-600 text-white hover:bg-primary-700 hover:shadow-[0_4px_12px_rgba(2,132,199,0.2)] w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>
        <p className="text-center text-white/40 text-xs mt-8">© {new Date().getFullYear()} DigitMonie. All rights reserved.</p>
      </div>
    </div>
  );
}

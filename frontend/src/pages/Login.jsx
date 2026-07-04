import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Loader2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      
      const res = await api.post('/auth/token', params);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', res.data.username);
      
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', role);
      params.append('password', 'password');
      const res = await api.post('/auth/token', params);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', res.data.username);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Demo login failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--th-bg)' }}
    >
      {/* Theme Toggle (top-right corner) */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-20 p-3 rounded-xl transition-all duration-200"
        style={{ 
          backgroundColor: 'var(--th-bg-card)', 
          border: '1px solid var(--th-border)',
          color: 'var(--th-text-secondary)' 
        }}
        title={theme === 'clinical' ? 'Switch to Night Shift' : 'Switch to Clinical Clean'}
      >
        {theme === 'clinical' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, var(--th-brand-gradient-from), var(--th-brand-gradient-to))` }}
          >
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 
          className="mt-6 text-center text-3xl font-extrabold tracking-tight"
          style={{ color: 'var(--th-text-primary)' }}
        >
          OPD Care System
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: 'var(--th-text-muted)' }}>
          Hospital Information Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel p-8">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--th-text-secondary)' }}>Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="th-input block w-full px-4 py-3 rounded-xl text-sm transition-all border focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--th-text-secondary)' }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="th-input block w-full px-4 py-3 rounded-xl text-sm transition-all border focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center font-medium bg-red-500/10 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              style={{ background: `linear-gradient(135deg, var(--th-brand-gradient-from), var(--th-brand-gradient-to))` }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 pt-8" style={{ borderTop: '1px solid var(--th-border)' }}>
            <p className="text-sm font-medium mb-4 text-center" style={{ color: 'var(--th-text-muted)' }}>Quick Login (Demo)</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { role: 'admin', label: 'Admin', bg: '#eff6ff', text: '#1d4ed8', darkBg: 'rgba(59,130,246,0.15)', darkText: '#60a5fa' },
                { role: 'doctor', label: 'Doctor', bg: '#ecfdf5', text: '#047857', darkBg: 'rgba(16,185,129,0.15)', darkText: '#34d399' },
                { role: 'receptionist', label: 'Reception', bg: '#fffbeb', text: '#b45309', darkBg: 'rgba(245,158,11,0.15)', darkText: '#fbbf24' },
                { role: 'pharmacist', label: 'Pharmacy', bg: '#fef2f2', text: '#b91c1c', darkBg: 'rgba(239,68,68,0.15)', darkText: '#f87171' },
                { role: 'lab_tech', label: 'Lab Tech', bg: '#ecfeff', text: '#0e7490', darkBg: 'rgba(6,182,212,0.15)', darkText: '#22d3ee' },
              ].map(item => (
                <button 
                  key={item.role}
                  type="button"
                  onClick={() => handleDemoLogin(item.role)}
                  className="py-2 px-2 text-xs font-semibold rounded-lg transition-all hover:opacity-80"
                  style={{
                    backgroundColor: theme === 'clinical' ? item.bg : item.darkBg,
                    color: theme === 'clinical' ? item.text : item.darkText
                  }}
                >{item.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

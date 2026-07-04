import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Receipt, Activity, LayoutDashboard, Pill, FlaskConical, Command } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
    }
  }, [isOpen]);

  const { data: searchResults } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query || query.toLowerCase().startsWith('bill ')) return [];
      const res = await api.get(`/patients/?search=${query}`);
      return res.data;
    },
    enabled: isOpen && query.length > 0 && !query.toLowerCase().startsWith('bill '),
  });

  const role = localStorage.getItem('role');

  const handleSelect = (path, state = null) => {
    setIsOpen(false);
    navigate(path, { state });
  };

  const handlePatientSelect = (patient) => {
    setIsOpen(false);
    if (role === 'doctor') {
      navigate(`/visit/${patient.id}`);
    } else {
      navigate('/patients');
    }
  };

  if (!isOpen) return null;

  const isBillCmd = query.toLowerCase().startsWith('bill ');
  const billId = isBillCmd ? query.split(' ')[1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Palette */}
      <div 
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--th-bg)', border: '1px solid var(--th-border)' }}
      >
        <div className="flex items-center px-4 py-3" style={{ borderBottom: '1px solid var(--th-border)' }}>
          <Search className="w-5 h-5 mr-3" style={{ color: 'var(--th-text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-lg focus:outline-none"
            style={{ color: 'var(--th-text-primary)' }}
            placeholder="Type a command or search patient name/UHID... (e.g. 'bill 104')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--th-bg-input)', color: 'var(--th-text-muted)' }}>
            <Command className="w-3 h-3" /> K
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Default Commands when no query */}
          {!query && (
            <div className="py-2">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--th-text-muted)' }}>Quick Links</div>
              {[
                { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { name: 'New Patient', path: '/patients/new', icon: User },
                { name: 'Pharmacy', path: '/pharmacy', icon: Pill },
                { name: 'Billing', path: '/billing', icon: Receipt },
                { name: 'Lab Diagnostics', path: '/lab', icon: FlaskConical }
              ].map((cmd) => (
                <button
                  key={cmd.name}
                  onClick={() => handleSelect(cmd.path)}
                  className="w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors"
                  style={{ color: 'var(--th-text-primary)' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--th-bg-nav-active)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <cmd.icon className="w-4 h-4 mr-3" style={{ color: 'var(--th-text-muted)' }} />
                  {cmd.name}
                </button>
              ))}
            </div>
          )}

          {/* Billing Command Match */}
          {isBillCmd && billId && (
            <div className="py-2">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--th-text-muted)' }}>Command</div>
              <button
                onClick={() => handleSelect('/billing', { patientId: billId })}
                className="w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors"
                style={{ backgroundColor: 'var(--th-bg-nav-active)', color: 'var(--th-text-accent)' }}
              >
                <Receipt className="w-5 h-5 mr-3" />
                <span className="font-bold">Jump to Billing for Patient #{billId}</span>
                <span className="ml-auto text-xs opacity-70">Enter ↵</span>
              </button>
            </div>
          )}

          {/* Patient Search Results */}
          {!isBillCmd && query && searchResults?.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--th-text-muted)' }}>Patients</div>
              {searchResults.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors"
                  style={{ color: 'var(--th-text-primary)' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--th-bg-nav-active)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-3" style={{ color: 'var(--th-text-muted)' }} />
                    <span className="font-medium">{patient.name}</span>
                    <span className="ml-3 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--th-bg-input)', color: 'var(--th-text-secondary)' }}>
                      #{patient.id} | {patient.uhid}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--th-text-muted)' }}>View Profile</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isBillCmd && query && searchResults?.length === 0 && (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--th-text-muted)' }}>
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

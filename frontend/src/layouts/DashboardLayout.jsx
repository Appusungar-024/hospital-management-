import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, Stethoscope, Receipt, LogOut, Pill, FlaskConical, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import CommandPalette from '../components/CommandPalette';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    window.location.reload();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'receptionist', 'doctor', 'pharmacist', 'lab_technician'] },
    { name: 'Patients', path: '/patients', icon: Users, roles: ['admin', 'receptionist', 'doctor'] },
    { name: 'Register Patient', path: '/patients/new', icon: UserPlus, roles: ['receptionist', 'admin'] },
    { name: 'Pharmacy', path: '/pharmacy', icon: Pill, roles: ['admin', 'pharmacist'] },
    { name: 'Lab Diagnostics', path: '/lab', icon: FlaskConical, roles: ['admin', 'lab_technician', 'doctor'] },
    { name: 'Billing & Expenses', path: '/billing', icon: Receipt, roles: ['receptionist', 'admin'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--th-bg)' }}>
      {/* Sidebar */}
      <div 
        className="w-64 fixed h-full z-10 flex flex-col justify-between overflow-hidden transition-colors duration-300"
        style={{ 
          backgroundColor: 'var(--th-bg-sidebar)', 
          borderRight: '1px solid var(--th-border)'
        }}
      >
        <div>
          {/* Brand Header */}
          <div 
            className="p-6"
            style={{ background: `linear-gradient(135deg, var(--th-brand-gradient-from), var(--th-brand-gradient-to))` }}
          >
            <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-2">
              <Stethoscope className="w-8 h-8" /> OPD Care
            </h1>
            <p className="text-blue-100 mt-2 text-sm opacity-80">Welcome, {username}</p>
            <span className="inline-block mt-1 px-2 py-1 bg-white/20 rounded text-xs text-white uppercase tracking-wider font-semibold">
              {role}
            </span>
          </div>
          
          {/* Navigation */}
          <nav className="p-4 space-y-1 mt-2">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium"
                  style={{
                    backgroundColor: isActive ? 'var(--th-bg-nav-active)' : 'transparent',
                    color: isActive ? 'var(--th-text-nav-active)' : 'var(--th-text-nav)'
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: isActive ? 'var(--th-text-nav-active)' : 'var(--th-text-muted)' }} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Theme Toggle + Logout */}
        <div className="p-4 space-y-2" style={{ borderTop: '1px solid var(--th-border)' }}>
          <button 
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium"
            style={{ color: 'var(--th-text-secondary)' }}
          >
            {theme === 'clinical' ? (
              <><Moon className="w-5 h-5" /> Night Shift Mode</>
            ) : (
              <><Sun className="w-5 h-5" /> Clinical Clean Mode</>
            )}
          </button>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}

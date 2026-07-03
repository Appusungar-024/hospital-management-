import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, Stethoscope, Receipt, LogOut, Pill, FlaskConical } from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Glassmorphism */}
      <div className="w-64 fixed h-full glass-panel z-10 m-4 flex flex-col justify-between overflow-hidden shadow-2xl border border-white/40">
        <div>
          <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600">
            <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-2">
              <Stethoscope className="w-8 h-8" /> OPD Care
            </h1>
            <p className="text-indigo-100 mt-2 text-sm">Welcome, {username}</p>
            <span className="inline-block mt-1 px-2 py-1 bg-white/20 rounded text-xs text-white uppercase tracking-wider font-semibold">
              {role}
            </span>
          </div>
          
          <nav className="p-4 space-y-2 mt-4">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm font-medium' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white/50">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-72 p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

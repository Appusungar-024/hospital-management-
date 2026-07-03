import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Skeleton from '../components/Skeleton';
import api from '../api/client';

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'nightshift';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6"><Skeleton className="h-10 w-64 mb-2" /><Skeleton className="h-5 w-96" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Skeleton className="h-80 w-full" /><Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  const cardColors = {
    blue:  { light: { bg: '#eff6ff', text: '#1d4ed8', icon: '#2563eb' }, dark: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', icon: '#3b82f6' } },
    green: { light: { bg: '#ecfdf5', text: '#047857', icon: '#059669' }, dark: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', icon: '#10b981' } },
    red:   { light: { bg: '#fef2f2', text: '#b91c1c', icon: '#dc2626' }, dark: { bg: 'rgba(239,68,68,0.12)', text: '#f87171', icon: '#ef4444' } },
    amber: { light: { bg: '#fffbeb', text: '#b45309', icon: '#d97706' }, dark: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', icon: '#f59e0b' } },
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => {
    const c = cardColors[color][isDark ? 'dark' : 'light'];
    return (
      <div className="glass-panel p-6 card-hover relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 opacity-30" style={{ backgroundColor: c.bg }}></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--th-text-muted)' }}>{title}</p>
            <h3 className="text-3xl font-bold" style={{ color: 'var(--th-text-primary)' }}>{value}</h3>
            {trend && <p className="text-xs mt-2 font-medium flex items-center gap-1" style={{ color: c.text }}><TrendingUp className="w-3 h-3"/> {trend}</p>}
          </div>
          <div className="p-4 rounded-2xl" style={{ backgroundColor: c.bg }}>
            <Icon className="w-8 h-8" style={{ color: c.icon }} />
          </div>
        </div>
      </div>
    );
  };

  const chartColors = {
    grid: isDark ? '#334155' : '#e2e8f0',
    tick: isDark ? '#64748b' : '#64748b',
    line: isDark ? '#60a5fa' : '#2563eb',
    bar:  isDark ? '#818cf8' : '#8b5cf6',
    tooltipBg: isDark ? '#1e293b' : '#ffffff',
    tooltipBorder: isDark ? '#475569' : '#e2e8f0',
    cursor: isDark ? '#334155' : '#f1f5f9',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--th-text-primary)' }}>Dashboard Overview</h1>
          <p className="mt-1" style={{ color: 'var(--th-text-muted)' }}>Real-time hospital statistics and analytics.</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value={stats?.total_patients || 0} icon={Users} color="blue" />
        <StatCard title="Revenue" value={`$${stats?.revenue || 0}`} icon={DollarSign} color="green" trend="+12% from last month" />
        <StatCard title="Expenses" value={`$${stats?.expenses || 0}`} icon={Activity} color="red" />
        <StatCard title="Waiting Queue" value={stats?.queue?.waiting || 0} icon={Users} color="amber" trend={`${stats?.queue?.seen || 0} seen today`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--th-text-primary)' }}>Patient Inflow (Last 7 Days)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: chartColors.tick}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: chartColors.tick}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: `1px solid ${chartColors.tooltipBorder}`, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: chartColors.tooltipBg, color: 'var(--th-text-primary)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="patients" 
                  stroke={chartColors.line} 
                  strokeWidth={3}
                  dot={{ r: 5, fill: chartColors.line, strokeWidth: 2, stroke: chartColors.tooltipBg }}
                  activeDot={{ r: 7, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--th-text-primary)' }}>Daily Queue Status</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Registered', count: stats?.queue?.registered_today || 0 },
                { name: 'Seen', count: stats?.queue?.seen || 0 },
                { name: 'Waiting', count: stats?.queue?.waiting || 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: chartColors.tick}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: chartColors.tick}} />
                <Tooltip 
                  cursor={{fill: chartColors.cursor}}
                  contentStyle={{ borderRadius: '12px', border: `1px solid ${chartColors.tooltipBorder}`, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: chartColors.tooltipBg, color: 'var(--th-text-primary)' }}
                />
                <Bar dataKey="count" fill={chartColors.bar} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Triage Kanban Board */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff' }}>
            <Users className="w-6 h-6" style={{ color: isDark ? '#60a5fa' : '#2563eb' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--th-text-primary)' }}>Triage Kanban Board</h3>
            <p className="text-sm" style={{ color: 'var(--th-text-muted)' }}>Real-time patient flow tracking.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { id: 'waiting', label: 'Waiting for Triage', color: 'blue' },
            { id: 'consultation', label: 'In Consultation', color: 'amber' },
            { id: 'lab', label: 'At Lab', color: 'red' },
            { id: 'pharmacy', label: 'Pharmacy / Billing', color: 'green' }
          ].map(column => (
            <div key={column.id} className="glass-panel p-4 h-[500px] overflow-y-auto flex flex-col gap-3" style={{ backgroundColor: 'var(--th-bg-input)' }}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm uppercase tracking-wider" style={{ color: cardColors[column.color][isDark ? 'dark' : 'light'].text }}>
                  {column.label}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: cardColors[column.color][isDark ? 'dark' : 'light'].bg, color: cardColors[column.color][isDark ? 'dark' : 'light'].text }}>
                  {stats?.queue?.kanban?.[column.id]?.length || 0}
                </span>
              </div>
              
              {stats?.queue?.kanban?.[column.id]?.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--th-border)' }}>
                  <p className="text-sm italic" style={{ color: 'var(--th-text-muted)' }}>Empty</p>
                </div>
              ) : (
                stats?.queue?.kanban?.[column.id]?.map((patient, idx) => (
                  <div key={idx} className="glass-panel p-4 cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-md" style={{ borderLeft: `4px solid ${cardColors[column.color][isDark ? 'dark' : 'light'].icon}` }}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm" style={{ color: 'var(--th-text-primary)' }}>{patient.patient_name}</span>
                      <span className="text-xs" style={{ color: 'var(--th-text-muted)' }}>#{patient.patient_id}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        patient.triage_level === 'Immediate Emergent' ? 'bg-red-100 text-red-800' :
                        patient.triage_level === 'Urgent' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {patient.triage_level}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--th-text-secondary)' }}>{patient.waiting_since}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

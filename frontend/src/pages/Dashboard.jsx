import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import api from '../api/client';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading dashboard...</div>;
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="glass-panel p-6 card-hover relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-100 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 opacity-50`}></div>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
          {trend && <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3"/> {trend}</p>}
        </div>
        <div className={`p-4 bg-${color}-100 text-${color}-600 rounded-2xl`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Real-time hospital statistics and analytics.</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value={stats?.total_patients || 0} icon={Users} color="indigo" />
        <StatCard title="Revenue" value={`$${stats?.revenue || 0}`} icon={DollarSign} color="emerald" trend="+12% from last month" />
        <StatCard title="Expenses" value={`$${stats?.expenses || 0}`} icon={Activity} color="rose" />
        <StatCard title="Waiting Queue" value={stats?.queue?.waiting || 0} icon={Users} color="amber" trend={`${stats?.queue?.seen || 0} seen today`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Patient Inflow (Last 7 Days)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="patients" 
                  stroke="#4f46e5" 
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Daily Queue Status</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Registered', count: stats?.queue?.registered_today || 0 },
                { name: 'Seen', count: stats?.queue?.seen || 0 },
                { name: 'Waiting', count: stats?.queue?.waiting || 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Triage Queue List */}
      <div className="glass-panel p-6 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Live Triage Queue</h3>
            <p className="text-sm text-slate-500">Patients waiting for doctor, sorted by clinical priority.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-sm font-semibold text-slate-600">Patient</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600">ID</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600">Triage Level</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-600 text-right">Waiting Since</th>
              </tr>
            </thead>
            <tbody>
              {stats?.queue?.list?.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-slate-500 italic">No patients currently waiting in queue.</td>
                </tr>
              ) : (
                stats?.queue?.list?.map((patient, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{patient.patient_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">#{patient.patient_id}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        patient.triage_level === 'Immediate Emergent' ? 'bg-red-100 text-red-800' :
                        patient.triage_level === 'Urgent' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {patient.triage_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500 text-right">{patient.waiting_since}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

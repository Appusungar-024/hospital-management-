import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Skeleton from '../components/Skeleton';

export default function Patients() {
  const [search, setSearch] = useState('');
  const role = localStorage.getItem('role');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: async () => {
      const res = await api.get(`/patients/?search=${search}`);
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--th-text-primary)' }}>Patient Directory</h1>
          <p className="mt-1" style={{ color: 'var(--th-text-muted)' }}>Search and manage patient records</p>
        </div>
        {(role === 'receptionist' || role === 'admin') && (
          <Link 
            to="/patients/new" 
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm hover:opacity-90"
            style={{ background: `linear-gradient(135deg, var(--th-brand-gradient-from), var(--th-brand-gradient-to))` }}
          >
            <UserPlus className="w-5 h-5" />
            New Patient
          </Link>
        )}
      </div>

      <div className="glass-panel p-6">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--th-text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name, mobile, or UHID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="th-input w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--th-border)', backgroundColor: 'var(--th-bg-input)' }}>
                <th className="px-6 py-4 font-semibold text-sm tracking-wide" style={{ color: 'var(--th-text-secondary)' }}>UHID</th>
                <th className="px-6 py-4 font-semibold text-sm tracking-wide" style={{ color: 'var(--th-text-secondary)' }}>Name</th>
                <th className="px-6 py-4 font-semibold text-sm tracking-wide" style={{ color: 'var(--th-text-secondary)' }}>Mobile</th>
                <th className="px-6 py-4 font-semibold text-sm tracking-wide" style={{ color: 'var(--th-text-secondary)' }}>Age/Gender</th>
                <th className="px-6 py-4 font-semibold text-sm tracking-wide text-right" style={{ color: 'var(--th-text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--th-border)' }}>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-28" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                    </tr>
                  ))}
                </>
              ) : patients?.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8" style={{ color: 'var(--th-text-muted)' }}>No patients found.</td></tr>
              ) : (
                patients?.map((patient) => (
                  <tr key={patient.id} className="transition-colors" style={{ borderBottom: '1px solid var(--th-border)' }}>
                    <td className="px-6 py-4 font-medium" style={{ color: 'var(--th-text-accent)' }}>{patient.uhid}</td>
                    <td className="px-6 py-4 font-medium" style={{ color: 'var(--th-text-primary)' }}>{patient.name}</td>
                    <td className="px-6 py-4" style={{ color: 'var(--th-text-secondary)' }}>{patient.mobile}</td>
                    <td className="px-6 py-4" style={{ color: 'var(--th-text-secondary)' }}>{patient.age} / {patient.gender}</td>
                    <td className="px-6 py-4 text-right">
                      {role === 'doctor' ? (
                        <Link to={`/visit/${patient.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-medium">
                          <FileText className="w-4 h-4" /> Consult
                        </Link>
                      ) : (
                        <span className="text-sm italic" style={{ color: 'var(--th-text-muted)' }}>N/A</span>
                      )}
                    </td>
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

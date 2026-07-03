import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';

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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-slate-500 mt-1">Search and manage patient records</p>
        </div>
        {(role === 'receptionist' || role === 'admin') && (
          <Link to="/patients/new" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <UserPlus className="w-5 h-5" />
            New Patient
          </Link>
        )}
      </div>

      <div className="glass-panel p-6">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, mobile, or UHID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm tracking-wide">UHID</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm tracking-wide">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm tracking-wide">Mobile</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm tracking-wide">Age/Gender</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading patients...</td></tr>
              ) : patients?.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No patients found.</td></tr>
              ) : (
                patients?.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-indigo-600">{patient.uhid}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{patient.name}</td>
                    <td className="px-6 py-4 text-slate-600">{patient.mobile}</td>
                    <td className="px-6 py-4 text-slate-600">{patient.age} / {patient.gender}</td>
                    <td className="px-6 py-4 text-right">
                      {role === 'doctor' ? (
                        <Link to={`/visit/${patient.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium">
                          <FileText className="w-4 h-4" /> Consult
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-sm italic">N/A</span>
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

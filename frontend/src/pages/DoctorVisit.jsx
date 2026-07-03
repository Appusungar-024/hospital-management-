import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HeartPulse, Weight, Activity, Pill, Save, AlertCircle, FlaskConical, Download, Plus, Clock, FileText } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import Skeleton from '../components/Skeleton';

export default function DoctorVisit() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ bp: '', weight: '', pulse: '', medicines: '', notes: '', follow_up_date: '' });

  const isHypertension = (bpString) => {
    if (!bpString) return false;
    const parts = bpString.split('/');
    if (parts.length === 2) {
      const sys = parseInt(parts[0]);
      const dia = parseInt(parts[1]);
      if (sys >= 140 || dia >= 90) return true;
    }
    return false;
  };
  const isHighBP = isHypertension(formData.bp);

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => { const res = await api.get(`/patients/${patientId}`); return res.data; }
  });
  const { data: pastVisits } = useQuery({
    queryKey: ['pastVisits', patientId],
    queryFn: async () => { const res = await api.get(`/visits/patient/${patientId}`); return res.data; }
  });
  const { data: labOrders } = useQuery({
    queryKey: ['labOrders', patientId],
    queryFn: async () => { const res = await api.get(`/lab/orders/patient/${patientId}`); return res.data; }
  });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/visits/', { ...formData, patient_id: parseInt(patientId) }); navigate('/patients'); }
    catch { alert("Error saving prescription"); } finally { setLoading(false); }
  };
  const createLabOrder = async () => {
    const test_type = prompt("Enter Test Name (e.g., Complete Blood Count, Chest X-Ray):");
    if (test_type) {
      try { await api.post('/lab/orders', { patient_id: parseInt(patientId), test_type }); queryClient.invalidateQueries(['labOrders', patientId]); alert("Lab Order sent!"); }
      catch { alert("Error creating Lab Order."); }
    }
  };

  if (patientLoading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-4">
        <Skeleton className="h-20 w-full mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 relative">
      {/* STICKY SUMMARY HEADER */}
      <div className="sticky top-0 z-10 p-4 rounded-xl shadow-sm flex items-center justify-between mb-2 backdrop-blur-md" style={{ border: '1px solid var(--th-border)', backgroundColor: 'var(--th-bg-sidebar)' }}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
           <div>
             <h2 className="font-bold text-lg leading-tight" style={{ color: 'var(--th-text-primary)' }}>{patient?.name}</h2>
             <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--th-text-muted)' }}>{patient?.uhid}</span>
           </div>
           <div className="flex items-center gap-4 text-sm font-medium" style={{ color: 'var(--th-text-secondary)' }}>
             <span className="px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--th-bg-input)' }}>{patient?.age} • {patient?.gender}</span>
             {patient?.existing_problems && (
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 flex items-center gap-1 font-bold text-xs">
                  <AlertCircle className="w-3 h-3" /> {patient.existing_problems}
                </span>
             )}
           </div>
        </div>
      </div>
      
      {/* SPLIT PANE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
        
        {/* LEFT PANE: READ-ONLY CONTEXT */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
          <div className="glass-panel p-5">
            <h3 className="font-bold text-md mb-3" style={{ color: 'var(--th-text-primary)' }}>Patient Profile</h3>
            <div className="space-y-3">
              <div><p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--th-text-muted)' }}>UHID</p><p className="font-medium" style={{ color: 'var(--th-text-accent)' }}>{patient?.uhid}</p></div>
              <div><p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--th-text-muted)' }}>Name</p><p className="font-medium" style={{ color: 'var(--th-text-primary)' }}>{patient?.name}</p></div>
              <div className="flex gap-4">
                <div><p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--th-text-muted)' }}>Age</p><p className="font-medium" style={{ color: 'var(--th-text-primary)' }}>{patient?.age}</p></div>
                <div><p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--th-text-muted)' }}>Gender</p><p className="font-medium" style={{ color: 'var(--th-text-primary)' }}>{patient?.gender}</p></div>
              </div>
            </div>
            {patient?.existing_problems && (
              <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-[10px] text-red-500 uppercase tracking-wider font-bold flex items-center gap-1 mb-1"><AlertCircle className="w-3 h-3"/> Existing Problems</p>
                <p className="text-sm font-medium text-red-400">{patient.existing_problems}</p>
              </div>
            )}
          </div>
          
          {/* PAST VISITS */}
          <div className="glass-panel p-5">
            <h3 className="font-bold text-md mb-3 flex items-center gap-2" style={{ color: 'var(--th-text-primary)' }}><Clock className="w-4 h-4" style={{ color: 'var(--th-text-accent)' }}/> Past Visits</h3>
            <div className="space-y-3">
              {pastVisits?.length === 0 ? <p className="text-xs italic" style={{ color: 'var(--th-text-muted)' }}>No past visits found.</p> : pastVisits?.slice().reverse().map(visit => (
                <div key={visit.id} className="p-3 rounded-xl" style={{ backgroundColor: 'var(--th-bg-input)', border: '1px solid var(--th-border)' }}>
                  <div className="flex justify-between items-center mb-2 pb-2" style={{ borderBottom: '1px solid var(--th-border)' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--th-text-secondary)' }}>{new Date(visit.created_at).toLocaleDateString()}</span>
                    <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--th-text-muted)' }}>Vitals: {visit.bp || '--'} BP, {visit.weight || '--'}</span>
                  </div>
                  {visit.medicines && (
                    <div className="text-xs">
                      <strong style={{ color: 'var(--th-text-primary)' }}>Rx:</strong>
                      <p className="mt-1 whitespace-pre-wrap" style={{ color: 'var(--th-text-secondary)' }}>{visit.medicines}</p>
                    </div>
                  )}
                  {visit.notes && (
                    <div className="text-xs mt-2">
                      <strong style={{ color: 'var(--th-text-primary)' }}>Notes:</strong>
                      <p className="mt-1" style={{ color: 'var(--th-text-secondary)' }}>{visit.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-md flex items-center gap-2" style={{ color: 'var(--th-text-primary)' }}><FlaskConical className="w-4 h-4" style={{ color: 'var(--th-text-accent)' }}/> Lab Diagnostics</h3>
              <button type="button" onClick={createLabOrder} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'var(--th-bg-nav-active)', color: 'var(--th-text-accent)' }} title="Order New Test"><Plus className="w-4 h-4"/></button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {labOrders?.length === 0 ? <p className="text-sm italic" style={{ color: 'var(--th-text-muted)' }}>No lab tests ordered.</p> : labOrders?.map(order => (
                <div key={order.id} className="p-3 rounded-xl" style={{ backgroundColor: 'var(--th-bg-input)', border: '1px solid var(--th-border)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm" style={{ color: 'var(--th-text-primary)' }}>{order.test_type}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{order.status}</span>
                  </div>
                  {order.result && (
                    <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--th-border)' }}>
                      {order.result.result_data && <p className="text-xs mb-1" style={{ color: 'var(--th-text-secondary)' }}><strong>Result:</strong> {order.result.result_data}</p>}
                      {order.result.attachment_url && <a href={order.result.attachment_url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1" style={{ color: 'var(--th-text-accent)' }}><Download className="w-3 h-3"/> Download Report</a>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* RIGHT PANE: ACTIVE INPUT FORM */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
          <div className="glass-panel p-6" style={{ border: '2px solid var(--th-text-accent)' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="pb-6" style={{ borderBottom: '1px solid var(--th-border)' }}>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--th-text-primary)' }}><Activity className="w-4 h-4" style={{ color: 'var(--th-text-accent)' }}/> New Vitals</h4>
                <div className="grid grid-cols-3 gap-4">
                  {[{icon: Activity, label: 'BP', key: 'bp', ph: '120/80'},{icon: HeartPulse, label: 'Pulse', key: 'pulse', ph: '72 bpm'},{icon: Weight, label: 'Weight', key: 'weight', ph: '70 kg'}].map(v => {
                    const isDanger = v.key === 'bp' && isHighBP;
                    return (
                      <div key={v.key}>
                        <label className={`flex items-center gap-2 text-xs font-semibold mb-1 ${isDanger ? 'text-red-600' : ''}`} style={!isDanger ? { color: 'var(--th-text-secondary)' } : {}}>
                          <v.icon className="w-3 h-3"/> {v.label}
                          {isDanger && <AlertCircle className="w-3 h-3 text-red-500" />}
                        </label>
                        <input 
                          type="text" 
                          placeholder={v.ph} 
                          value={formData[v.key]} 
                          onChange={(e)=>setFormData({...formData, [v.key]: e.target.value})} 
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none transition-colors ${
                            isDanger 
                              ? 'border-red-500 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500' 
                              : 'th-input focus:ring-2 focus:ring-blue-500'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--th-text-primary)' }}><FileText className="w-4 h-4" style={{ color: 'var(--th-text-accent)' }}/> Clinical Notes & Diagnosis</h4>
                <textarea placeholder="Patient complains of..." value={formData.notes} onChange={(e)=>setFormData({...formData, notes: e.target.value})} className="th-input w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px]"></textarea>
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 mt-2" style={{ color: 'var(--th-text-primary)' }}><Pill className="w-4 h-4" style={{ color: 'var(--th-text-accent)' }}/> E-Prescription</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--th-text-secondary)' }}>Medicines</label>
                    <textarea required placeholder="1. Paracetamol 500mg - 1-0-1" value={formData.medicines} onChange={(e)=>setFormData({...formData, medicines: e.target.value})} className="th-input w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[140px]"></textarea>
                  </div>
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: 'var(--th-text-secondary)' }}>Follow-up Date (Optional)</label><input type="date" value={formData.follow_up_date} onChange={(e)=>setFormData({...formData, follow_up_date: e.target.value})} className="th-input w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"/></div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={loading} className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-sm hover:opacity-90" style={{ background: `linear-gradient(135deg, var(--th-brand-gradient-from), var(--th-brand-gradient-to))` }}>
                  <Save className="w-5 h-5" />{loading ? 'Saving...' : 'Save Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

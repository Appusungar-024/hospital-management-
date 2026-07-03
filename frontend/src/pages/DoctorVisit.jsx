import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HeartPulse, Weight, Activity, Pill, Save, AlertCircle, FlaskConical, FileText, Download, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

export default function DoctorVisit() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bp: '', weight: '', pulse: '', medicines: '', notes: '', follow_up_date: ''
  });

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}`);
      return res.data;
    }
  });

  const { data: labOrders, isLoading: labsLoading } = useQuery({
    queryKey: ['labOrders', patientId],
    queryFn: async () => {
      const res = await api.get(`/lab/orders/patient/${patientId}`);
      return res.data;
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/visits/', { ...formData, patient_id: parseInt(patientId) });
      navigate('/patients');
    } catch (err) {
      alert("Error saving prescription");
    } finally {
      setLoading(false);
    }
  };

  const createLabOrder = async () => {
    const test_type = prompt("Enter Test Name (e.g., Complete Blood Count, Chest X-Ray):");
    if (test_type) {
      try {
        await api.post('/lab/orders', { patient_id: parseInt(patientId), test_type });
        queryClient.invalidateQueries(['labOrders', patientId]);
        alert("Lab Order sent successfully!");
      } catch (err) {
        alert("Error creating Lab Order. Ensure the patient is properly registered for today.");
      }
    }
  };

  if (patientLoading) return <div className="p-8 text-center">Loading patient data...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Doctor Consultation</h1>
          <p className="text-slate-500 mt-1">Record vitals and write prescription</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Info Card */}
          <div className="glass-panel p-6 bg-gradient-to-b from-indigo-50 to-white">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Patient Profile</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">UHID</p>
                <p className="font-medium text-indigo-700">{patient?.uhid}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Name</p>
                <p className="font-medium text-slate-900">{patient?.name}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Age</p>
                  <p className="font-medium text-slate-900">{patient?.age}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Gender</p>
                  <p className="font-medium text-slate-900">{patient?.gender}</p>
                </div>
              </div>
            </div>

            {patient?.existing_problems && (
              <div className="mt-6 p-4 bg-rose-50 rounded-xl border border-rose-100">
                <p className="text-xs text-rose-500 uppercase tracking-wider font-bold flex items-center gap-1 mb-2">
                  <AlertCircle className="w-3 h-3"/> Existing Problems
                </p>
                <p className="text-sm text-rose-900 font-medium">{patient.existing_problems}</p>
              </div>
            )}
          </div>

          {/* Lab Orders Section */}
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-indigo-600"/> Lab Diagnostics
              </h3>
              <button 
                type="button" onClick={createLabOrder}
                className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                title="Order New Test"
              >
                <Plus className="w-4 h-4"/>
              </button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {labOrders?.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No lab tests ordered.</p>
              ) : (
                labOrders?.map(order => (
                  <div key={order.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm text-slate-800">{order.test_type}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    {order.result && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        {order.result.result_data && <p className="text-xs text-slate-700 mb-1"><strong>Result:</strong> {order.result.result_data}</p>}
                        {order.result.attachment_url && (
                          <a href={order.result.attachment_url} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                            <Download className="w-3 h-3"/> Download Report
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-panel p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="border-b border-slate-100 pb-6">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Vitals</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1"><Activity className="w-3 h-3"/> BP</label>
                    <input 
                      type="text" placeholder="120/80" value={formData.bp} onChange={(e)=>setFormData({...formData, bp: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1"><HeartPulse className="w-3 h-3"/> Pulse</label>
                    <input 
                      type="text" placeholder="72 bpm" value={formData.pulse} onChange={(e)=>setFormData({...formData, pulse: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1"><Weight className="w-3 h-3"/> Weight</label>
                    <input 
                      type="text" placeholder="70 kg" value={formData.weight} onChange={(e)=>setFormData({...formData, weight: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><Pill className="w-4 h-4 text-indigo-600"/> Prescription & Follow-up</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Medicines</label>
                    <textarea 
                      required placeholder="1. Paracetamol 500mg - 1-0-1&#10;2. Amoxicillin 250mg - 1-1-1"
                      value={formData.medicines} onChange={(e)=>setFormData({...formData, medicines: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor Notes / Remarks</label>
                    <textarea 
                      placeholder="Advised complete rest for 3 days."
                      value={formData.notes} onChange={(e)=>setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Follow-up Date (Optional)</label>
                    <input 
                      type="date"
                      value={formData.follow_up_date} onChange={(e)=>setFormData({...formData, follow_up_date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" disabled={loading}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Prescription'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

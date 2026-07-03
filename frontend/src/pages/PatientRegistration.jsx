import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, Phone, Calendar, Activity } from 'lucide-react';
import api from '../api/client';

const InputWrapper = ({ icon: Icon, label, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-3 text-slate-400">
        <Icon className="w-5 h-5" />
      </div>
      {children}
    </div>
  </div>
);

export default function PatientRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: 'Male',
    existing_problems: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/patients/', {
        ...formData,
        age: parseInt(formData.age)
      });
      navigate('/patients');
    } catch (err) {
      alert("Error registering patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Register New Patient</h1>
        <p className="text-slate-500 mt-1">Enter patient demographic and health information.</p>
      </div>

      <div className="glass-panel p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputWrapper icon={User} label="Full Name">
              <input 
                type="text" required
                value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
              />
            </InputWrapper>
            
            <InputWrapper icon={Phone} label="Mobile Number">
              <input 
                type="tel" required
                value={formData.mobile} onChange={(e)=>setFormData({...formData, mobile: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+1 234 567 890"
              />
            </InputWrapper>
            
            <InputWrapper icon={Calendar} label="Age">
              <input 
                type="number" required min="0" max="150"
                value={formData.age} onChange={(e)=>setFormData({...formData, age: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="35"
              />
            </InputWrapper>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
              <select 
                value={formData.gender} onChange={(e)=>setFormData({...formData, gender: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <InputWrapper icon={Activity} label="Existing Problems (Encrypted in DB)">
            <textarea 
              value={formData.existing_problems} onChange={(e)=>setFormData({...formData, existing_problems: e.target.value})}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
              placeholder="Diabetes, Hypertension, etc."
            ></textarea>
          </InputWrapper>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

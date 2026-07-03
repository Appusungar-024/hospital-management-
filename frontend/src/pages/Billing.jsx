import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, DollarSign, Download, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import api from '../api/client';

export default function Billing() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const role = localStorage.getItem('role');
  
  // Decide which tabs to show based on role
  const canBill = role === 'receptionist' || role === 'admin';
  const canViewExpenses = role === 'admin';
  const canManageClaims = role === 'receptionist' || role === 'admin';
  
  const [activeTab, setActiveTab] = useState(canBill ? 'billing' : 'expenses');

  const [patientIdStr, setPatientIdStr] = useState(location.state?.patientId || '');
  
  useEffect(() => {
    if (location.state?.patientId) {
      setPatientIdStr(location.state.patientId);
      setActiveTab('billing');
    }
  }, [location.state]);

  const [formData, setFormData] = useState({ 
    amount: '', 
    payment_mode: 'Cash',
    apply_insurance: false,
    provider_name: '',
    policy_number: '',
    insurance_payable: ''
  });

  // Get recent expenses
  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await api.get('/billing/expenses');
      return res.data;
    }
  });

  const billingMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/billing/billing', data);
      return res.data;
    },
    onSuccess: async (data) => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Bill Created Successfully! Receipt ID: ${data.receipt_id}`);

      // Auto trigger download
      try {
        const response = await api.get(`/billing/billing/${data.id}/receipt`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receipt_${data.receipt_id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } catch (err) {
        console.error("Error downloading PDF", err);
        toast.error("Failed to download PDF receipt.");
      }

      setPatientIdStr('');
      setFormData({ 
        amount: '', payment_mode: 'Cash', apply_insurance: false, 
        provider_name: '', policy_number: '', insurance_payable: '' 
      });
      queryClient.invalidateQueries(['dashboard-stats']);
      queryClient.invalidateQueries(['claims']);
    }
  });

  const handleBillingSubmit = (e) => {
    e.preventDefault();
    if (!patientIdStr) return toast.error('Please enter a Patient ID');
    billingMutation.mutate({
      patient_id: parseInt(patientIdStr),
      amount: parseFloat(formData.amount),
      payment_mode: formData.payment_mode,
      apply_insurance: formData.apply_insurance,
      provider_name: formData.apply_insurance ? formData.provider_name : null,
      policy_number: formData.apply_insurance ? formData.policy_number : null,
      insurance_payable: formData.apply_insurance ? parseFloat(formData.insurance_payable) : 0
    });
  };

  const [expenseData, setExpenseData] = useState({ description: '', amount: '' });
  const expenseMutation = useMutation({
    mutationFn: async (data) => {
      await api.post('/billing/expenses', data);
    },
    onSuccess: () => {
      toast.success('Expense logged successfully!');
      setExpenseData({ description: '', amount: '' });
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['dashboard-stats']);
    }
  });

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    expenseMutation.mutate({
      description: expenseData.description,
      amount: parseFloat(expenseData.amount)
    });
  };

  // Claims Queries
  const { data: claims } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const res = await api.get('/billing/claims');
      return res.data;
    }
  });

  const updateClaimMutation = useMutation({
    mutationFn: async ({ id, status, approved_amount }) => 
      await api.put(`/billing/claims/${id}?status=${status}${approved_amount ? `&approved_amount=${approved_amount}` : ''}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['claims']);
      toast.success('Claim status updated successfully!');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    }
  });

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--th-text-primary)' }}>Billing & Finance</h1>
          <p className="mt-1" style={{ color: 'var(--th-text-muted)' }}>Manage patient fees, expenses, and insurance</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid var(--th-border)' }}>
        {canBill && (
          <button 
            onClick={() => setActiveTab('billing')}
            className="py-3 px-6 font-medium text-sm transition-colors"
            style={{ borderBottom: activeTab === 'billing' ? '2px solid var(--th-text-accent)' : '2px solid transparent', color: activeTab === 'billing' ? 'var(--th-text-accent)' : 'var(--th-text-muted)' }}
          >
            Patient Billing
          </button>
        )}
        {canManageClaims && (
          <button 
            onClick={() => setActiveTab('claims')}
            className="py-3 px-6 font-medium text-sm transition-colors"
            style={{ borderBottom: activeTab === 'claims' ? '2px solid var(--th-text-accent)' : '2px solid transparent', color: activeTab === 'claims' ? 'var(--th-text-accent)' : 'var(--th-text-muted)' }}
          >
            Insurance Claims
          </button>
        )}
        {canViewExpenses && (
          <button 
            onClick={() => setActiveTab('expenses')}
            className="py-3 px-6 font-medium text-sm transition-colors"
            style={{ borderBottom: activeTab === 'expenses' ? '2px solid var(--th-text-accent)' : '2px solid transparent', color: activeTab === 'expenses' ? 'var(--th-text-accent)' : 'var(--th-text-muted)' }}
          >
            Expense Tracking
          </button>
        )}
      </div>

      {activeTab === 'billing' && canBill && (
        <div className="max-w-3xl glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}>
              <Receipt className="w-6 h-6" style={{ color: '#10b981' }} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--th-text-primary)' }}>Generate Patient Bill</h3>
          </div>

          <form onSubmit={handleBillingSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--th-text-secondary)' }}>Patient Database ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5" style={{ color: 'var(--th-text-muted)' }} />
                <input
                  type="number" required placeholder="e.g. 1"
                  value={patientIdStr} onChange={(e) => setPatientIdStr(e.target.value)}
                  className="th-input w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--th-text-secondary)' }}>Consultation Fee / Base Amount ($)</label>
              <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5" style={{ color: 'var(--th-text-muted)' }} />
                  <input
                    type="number" required step="0.01" min="0" placeholder="50.00"
                    value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="th-input w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--th-text-muted)' }}>Pharmacy costs are added automatically.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--th-text-secondary)' }}>Payment Mode (for Patient Co-Pay)</label>
                <select
                  value={formData.payment_mode} onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="th-input w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>

            <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--th-border)' }}>
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" checked={formData.apply_insurance} onChange={e => setFormData({...formData, apply_insurance: e.target.checked})} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium" style={{ color: 'var(--th-text-secondary)' }}>Apply Insurance / TPA (Split Billing)</span>
              </label>
              
              {formData.apply_insurance && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Provider Name</label>
                    <input required type="text" value={formData.provider_name} onChange={e => setFormData({...formData, provider_name: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="e.g. BlueCross" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Policy Number</label>
                    <input required type="text" value={formData.policy_number} onChange={e => setFormData({...formData, policy_number: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="POL-12345" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Insurance Pays ($)</label>
                    <input required type="number" step="0.01" min="0" value={formData.insurance_payable} onChange={e => setFormData({...formData, insurance_payable: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="0.00" />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit" disabled={billingMutation.isPending}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, var(--th-brand-gradient-from), var(--th-brand-gradient-to))` }}
            >
              {billingMutation.isPending ? 'Processing...' : <><Download className="w-5 h-5" /> Generate Bill & Download Receipt</>}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'claims' && canManageClaims && (
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <ShieldCheck className="w-6 h-6" style={{ color: '#3b82f6' }} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--th-text-primary)' }}>Insurance Claims Management</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--th-border)' }}>
                  <th className="py-3 px-4 text-sm font-semibold" style={{ color: 'var(--th-text-secondary)' }}>Patient</th>
                  <th className="py-3 px-4 text-sm font-semibold" style={{ color: 'var(--th-text-secondary)' }}>Provider & Policy</th>
                  <th className="py-3 px-4 text-sm font-semibold text-right" style={{ color: 'var(--th-text-secondary)' }}>Claim Amount</th>
                  <th className="py-3 px-4 text-sm font-semibold" style={{ color: 'var(--th-text-secondary)' }}>Status</th>
                  <th className="py-3 px-4 text-sm font-semibold" style={{ color: 'var(--th-text-secondary)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims?.length === 0 && <tr><td colSpan="5" className="py-8 text-center text-slate-500">No insurance claims found.</td></tr>}
                {claims?.map((claim) => (
                  <tr key={claim.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{claim.patient_name}</div>
                      <div className="text-xs text-slate-500">Rec: {claim.receipt_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{claim.provider_name}</div>
                      <div className="text-xs text-slate-500">{claim.policy_number}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      ${claim.claim_amount?.toFixed(2)}
                      {claim.approved_amount && <div className="text-xs text-emerald-600 font-bold mt-1">Approved: ${claim.approved_amount}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        claim.claim_status === 'Settled' ? 'bg-emerald-100 text-emerald-800' :
                        claim.claim_status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {claim.claim_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      {claim.claim_status === 'Pending Approval' && (
                        <button 
                          onClick={() => {
                            const amt = prompt(`Enter Approved Amount for ${claim.provider_name} claim (Requested: $${claim.claim_amount}):`, claim.claim_amount);
                            if (amt !== null) updateClaimMutation.mutate({ id: claim.id, status: 'Approved', approved_amount: parseFloat(amt) });
                          }}
                          className="text-xs font-medium text-blue-600 hover:text-blue-900 border border-blue-200 px-3 py-1 rounded-full hover:bg-blue-50 transition-colors w-full"
                        >Approve Claim</button>
                      )}
                      {claim.claim_status === 'Approved' && (
                        <button 
                          onClick={() => {
                            if(window.confirm('Mark this claim as Settled (money received from Insurance)?'))
                              updateClaimMutation.mutate({ id: claim.id, status: 'Settled' });
                          }}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-900 border border-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-50 transition-colors w-full"
                        >Mark Settled</button>
                      )}
                      {claim.claim_status === 'Settled' && <span className="text-xs text-slate-400 font-medium text-center block w-full">Completed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && canViewExpenses && (
        <div className="max-w-3xl glass-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <DollarSign className="w-6 h-6" style={{ color: '#ef4444' }} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--th-text-primary)' }}>Hospital Expense Log</h3>
          </div>

          <form onSubmit={handleExpenseSubmit} className="space-y-4 mb-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <input
                  type="text" required placeholder="Expense description (e.g., Cleaning Supplies)"
                  value={expenseData.description} onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <input
                  type="number" required step="0.01" placeholder="Amt $"
                  value={expenseData.amount} onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
            <button
              type="submit" disabled={expenseMutation.isPending}
              className="w-full py-2.5 rounded-lg font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              {expenseMutation.isPending ? 'Logging...' : 'Log Expense'}
            </button>
          </form>

          <div>
            <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wider">Recent Expenses</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {expenses?.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No expenses logged yet.</p>
              ) : (
                expenses?.slice().reverse().map((exp, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700 text-sm">{exp.description}</span>
                    <span className="font-bold text-rose-600 text-sm">-${exp.amount.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

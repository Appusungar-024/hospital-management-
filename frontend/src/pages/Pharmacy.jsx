import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pill, PackagePlus, CheckCircle, Clock } from 'lucide-react';
import api from '../api/client';

export default function Pharmacy() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'inventory'

  // ----- Inventory State -----
  const [invData, setInvData] = useState({ medicine_name: '', stock_quantity: '', unit_price: '' });

  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await api.get('/pharmacy/inventory');
      return res.data;
    }
  });

  const addInvMutation = useMutation({
    mutationFn: async (data) => await api.post('/pharmacy/inventory', data),
    onSuccess: () => {
      setInvData({ medicine_name: '', stock_quantity: '', unit_price: '' });
      queryClient.invalidateQueries(['inventory']);
      alert('Inventory Updated Successfully');
    }
  });

  const handleInvSubmit = (e) => {
    e.preventDefault();
    addInvMutation.mutate({
      medicine_name: invData.medicine_name,
      stock_quantity: parseInt(invData.stock_quantity),
      unit_price: parseFloat(invData.unit_price)
    });
  };

  // ----- Pending Prescriptions State -----
  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending_prescriptions'],
    queryFn: async () => {
      const res = await api.get('/pharmacy/pending_prescriptions');
      return res.data;
    }
  });

  const [dispenseItems, setDispenseItems] = useState([{ inventory_id: '', quantity: 1 }]);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const dispenseMutation = useMutation({
    mutationFn: async (data) => await api.post('/pharmacy/dispense', data),
    onSuccess: () => {
      setSelectedVisit(null);
      setDispenseItems([{ inventory_id: '', quantity: 1 }]);
      queryClient.invalidateQueries(['pending_prescriptions']);
      queryClient.invalidateQueries(['inventory']);
      alert('Medicines Dispensed. Cost added to patient billing.');
    },
    onError: (err) => {
      alert(err.response?.data?.detail || "Error dispensing");
    }
  });

  const handleDispenseSubmit = (e) => {
    e.preventDefault();
    if (!selectedVisit) return;
    dispenseMutation.mutate({
      visit_id: selectedVisit.visit_id,
      items: dispenseItems.map(item => ({
        inventory_id: parseInt(item.inventory_id),
        quantity: parseInt(item.quantity)
      }))
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pharmacy Module</h1>
          <p className="text-slate-500 mt-1">Manage prescriptions and medicine stock.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'pending' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Pending Prescriptions
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Inventory Management
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Stock Form */}
          <div className="glass-panel p-6 lg:col-span-1 h-fit">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <PackagePlus className="w-5 h-5 text-indigo-600"/> Add / Update Stock
            </h3>
            <form onSubmit={handleInvSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name</label>
                <input required type="text" value={invData.medicine_name} onChange={e => setInvData({...invData, medicine_name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Paracetamol 500mg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input required type="number" min="1" value={invData.stock_quantity} onChange={e => setInvData({...invData, stock_quantity: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price ($)</label>
                  <input required type="number" step="0.01" min="0" value={invData.unit_price} onChange={e => setInvData({...invData, unit_price: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="0.50" />
                </div>
              </div>
              <button type="submit" disabled={addInvMutation.isPending} className="w-full py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                {addInvMutation.isPending ? 'Updating...' : 'Save Inventory'}
              </button>
            </form>
          </div>

          {/* Current Stock Table */}
          <div className="glass-panel p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Pill className="w-5 h-5 text-indigo-600"/> Current Stock Levels
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-4 text-sm font-semibold text-slate-600">Medicine Name</th>
                    <th className="py-2 px-4 text-sm font-semibold text-slate-600 text-right">Stock</th>
                    <th className="py-2 px-4 text-sm font-semibold text-slate-600 text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory?.map(item => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-800">{item.medicine_name}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${item.stock_quantity < 20 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {item.stock_quantity}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">${item.unit_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Needs Dispensing</h3>
            {pending?.length === 0 ? (
              <p className="text-slate-500 italic">No pending prescriptions found.</p>
            ) : (
              pending?.map((p) => (
                <div key={p.visit_id} onClick={() => setSelectedVisit(p)} className={`glass-panel p-4 cursor-pointer border-2 transition-colors ${selectedVisit?.visit_id === p.visit_id ? 'border-indigo-500 shadow-md' : 'border-transparent hover:border-indigo-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800">{p.patient_name}</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><Clock className="w-3 h-3"/> Pending</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2"><strong>Doctor Wrote:</strong> {p.prescribed_medicines}</p>
                </div>
              ))
            )}
          </div>

          {selectedVisit && (
            <div className="glass-panel p-6 h-fit sticky top-6 border-2 border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5"/> Dispense for {selectedVisit.patient_name}
              </h3>
              <form onSubmit={handleDispenseSubmit} className="space-y-4">
                {dispenseItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Select Medicine</label>
                      <select required value={item.inventory_id} onChange={(e) => {
                          const newItems = [...dispenseItems];
                          newItems[idx].inventory_id = e.target.value;
                          setDispenseItems(newItems);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose --</option>
                        {inventory?.filter(i => i.stock_quantity > 0).map(inv => (
                          <option key={inv.id} value={inv.id}>{inv.medicine_name} (${inv.unit_price})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
                      <input type="number" required min="1" value={item.quantity} onChange={(e) => {
                          const newItems = [...dispenseItems];
                          newItems[idx].quantity = e.target.value;
                          setDispenseItems(newItems);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
                
                <button type="button" onClick={() => setDispenseItems([...dispenseItems, { inventory_id: '', quantity: 1 }])} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  + Add another medicine
                </button>

                <div className="pt-4 border-t border-slate-100 mt-4">
                  <button type="submit" disabled={dispenseMutation.isPending} className="w-full py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors">
                    {dispenseMutation.isPending ? 'Processing...' : 'Complete Dispensing'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

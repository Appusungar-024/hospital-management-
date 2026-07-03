import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pill, PackagePlus, CheckCircle, Clock } from 'lucide-react';
import api from '../api/client';

export default function Pharmacy() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');

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

  const tabClass = (isActive) => ({
    borderBottom: isActive ? '2px solid var(--th-text-accent)' : '2px solid transparent',
    color: isActive ? 'var(--th-text-accent)' : 'var(--th-text-muted)',
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--th-text-primary)' }}>Pharmacy Module</h1>
          <p className="mt-1" style={{ color: 'var(--th-text-muted)' }}>Manage prescriptions and medicine stock.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid var(--th-border)' }}>
        <button onClick={() => setActiveTab('pending')} className="py-3 px-6 font-medium text-sm transition-colors" style={tabClass(activeTab === 'pending')}>
          Pending Prescriptions
        </button>
        <button onClick={() => setActiveTab('inventory')} className="py-3 px-6 font-medium text-sm transition-colors" style={tabClass(activeTab === 'inventory')}>
          Inventory Management
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 lg:col-span-1 h-fit">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--th-text-primary)' }}>
              <PackagePlus className="w-5 h-5" style={{ color: 'var(--th-text-accent)' }}/> Add / Update Stock
            </h3>
            <form onSubmit={handleInvSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--th-text-secondary)' }}>Medicine Name</label>
                <input required type="text" value={invData.medicine_name} onChange={e => setInvData({...invData, medicine_name: e.target.value})} className="th-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. Paracetamol 500mg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--th-text-secondary)' }}>Quantity</label>
                  <input required type="number" min="1" value={invData.stock_quantity} onChange={e => setInvData({...invData, stock_quantity: e.target.value})} className="th-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--th-text-secondary)' }}>Unit Price ($)</label>
                  <input required type="number" step="0.01" min="0" value={invData.unit_price} onChange={e => setInvData({...invData, unit_price: e.target.value})} className="th-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0.50" />
                </div>
              </div>
              <button type="submit" disabled={addInvMutation.isPending} className="w-full py-2.5 rounded-lg font-medium text-white transition-colors hover:opacity-90" style={{ background: `linear-gradient(135deg, var(--th-brand-gradient-from), var(--th-brand-gradient-to))` }}>
                {addInvMutation.isPending ? 'Updating...' : 'Save Inventory'}
              </button>
            </form>
          </div>

          <div className="glass-panel p-6 lg:col-span-2">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--th-text-primary)' }}>
              <Pill className="w-5 h-5" style={{ color: 'var(--th-text-accent)' }}/> Current Stock Levels
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--th-border)' }}>
                    <th className="py-2 px-4 text-sm font-semibold" style={{ color: 'var(--th-text-secondary)' }}>Medicine Name</th>
                    <th className="py-2 px-4 text-sm font-semibold text-right" style={{ color: 'var(--th-text-secondary)' }}>Stock</th>
                    <th className="py-2 px-4 text-sm font-semibold text-right" style={{ color: 'var(--th-text-secondary)' }}>Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory?.map(item => (
                    <tr key={item.id} className="transition-colors" style={{ borderBottom: '1px solid var(--th-border)' }}>
                      <td className="py-3 px-4 font-medium" style={{ color: 'var(--th-text-primary)' }}>{item.medicine_name}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${item.stock_quantity < 20 ? 'text-red-500' : ''}`} style={{ color: item.stock_quantity < 20 ? undefined : 'var(--th-text-primary)' }}>
                        {item.stock_quantity}
                      </td>
                      <td className="py-3 px-4 text-right" style={{ color: 'var(--th-text-secondary)' }}>${item.unit_price.toFixed(2)}</td>
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
            <h3 className="text-lg font-bold" style={{ color: 'var(--th-text-primary)' }}>Needs Dispensing</h3>
            {pending?.length === 0 ? (
              <p className="italic" style={{ color: 'var(--th-text-muted)' }}>No pending prescriptions found.</p>
            ) : (
              pending?.map((p) => (
                <div 
                  key={p.visit_id} 
                  onClick={() => setSelectedVisit(p)} 
                  className="glass-panel p-4 cursor-pointer transition-all"
                  style={{ 
                    borderWidth: '2px', 
                    borderStyle: 'solid',
                    borderColor: selectedVisit?.visit_id === p.visit_id ? 'var(--th-text-accent)' : 'var(--th-border)'
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold" style={{ color: 'var(--th-text-primary)' }}>{p.patient_name}</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full"><Clock className="w-3 h-3"/> Pending</span>
                  </div>
                  <p className="text-sm mt-2" style={{ color: 'var(--th-text-secondary)' }}><strong>Doctor Wrote:</strong> {p.prescribed_medicines}</p>
                </div>
              ))
            )}
          </div>

          {selectedVisit && (
            <div className="glass-panel p-6 h-fit sticky top-6" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'var(--th-text-accent)', opacity: 0.98 }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--th-text-accent)' }}>
                <CheckCircle className="w-5 h-5"/> Dispense for {selectedVisit.patient_name}
              </h3>
              <form onSubmit={handleDispenseSubmit} className="space-y-4">
                {dispenseItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--th-text-muted)' }}>Select Medicine</label>
                      <select required value={item.inventory_id} onChange={(e) => {
                          const newItems = [...dispenseItems];
                          newItems[idx].inventory_id = e.target.value;
                          setDispenseItems(newItems);
                        }}
                        className="th-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">-- Choose --</option>
                        {inventory?.filter(i => i.stock_quantity > 0).map(inv => (
                          <option key={inv.id} value={inv.id}>{inv.medicine_name} (${inv.unit_price})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--th-text-muted)' }}>Qty</label>
                      <input type="number" required min="1" value={item.quantity} onChange={(e) => {
                          const newItems = [...dispenseItems];
                          newItems[idx].quantity = e.target.value;
                          setDispenseItems(newItems);
                        }}
                        className="th-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
                
                <button type="button" onClick={() => setDispenseItems([...dispenseItems, { inventory_id: '', quantity: 1 }])} className="text-sm font-medium" style={{ color: 'var(--th-text-accent)' }}>
                  + Add another medicine
                </button>

                <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--th-border)' }}>
                  <button type="submit" disabled={dispenseMutation.isPending} className="w-full py-3 rounded-xl font-bold text-white shadow-sm transition-colors hover:opacity-90" style={{ background: `linear-gradient(135deg, var(--th-brand-gradient-from), var(--th-brand-gradient-to))` }}>
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

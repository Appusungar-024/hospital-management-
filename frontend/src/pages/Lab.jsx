import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, CheckCircle, Upload } from 'lucide-react';
import api from '../api/client';

export default function Lab() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [resultData, setResultData] = useState('');
  const [file, setFile] = useState(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['allLabOrders'],
    queryFn: async () => {
      const res = await api.get('/lab/orders');
      return res.data;
    }
  });

  const uploadResultMutation = useMutation({
    mutationFn: async (formData) => {
      await api.post(`/lab/orders/${selectedOrder.id}/result`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      setSelectedOrder(null);
      setResultData('');
      setFile(null);
      queryClient.invalidateQueries(['allLabOrders']);
      alert('Lab results uploaded successfully!');
    }
  });

  const handleUpload = (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    const formData = new FormData();
    if (resultData) formData.append('result_data', resultData);
    if (file) formData.append('file', file);
    
    if (!resultData && !file) {
      alert("Please provide either text results or upload a file.");
      return;
    }
    
    uploadResultMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--th-text-primary)' }}>Diagnostics Laboratory</h1>
        <p className="mt-1" style={{ color: 'var(--th-text-muted)' }}>Process test orders and upload diagnostic results.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--th-text-primary)' }}>
            <FlaskConical className="w-5 h-5" style={{ color: 'var(--th-text-accent)' }}/> Test Orders Queue
          </h3>
          
          <div className="space-y-4">
            {isLoading && <p style={{ color: 'var(--th-text-muted)' }}>Loading orders...</p>}
            {orders?.length === 0 && <p className="italic" style={{ color: 'var(--th-text-muted)' }}>No lab orders in queue.</p>}
            
            {orders?.map((order) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="p-4 rounded-xl cursor-pointer transition-all"
                style={{
                  backgroundColor: selectedOrder?.id === order.id ? 'var(--th-bg-nav-active)' : 'var(--th-bg-card)',
                  border: `2px solid ${selectedOrder?.id === order.id ? 'var(--th-text-accent)' : 'var(--th-border)'}`
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold" style={{ color: 'var(--th-text-primary)' }}>{order.test_type}</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-sm" style={{ color: 'var(--th-text-secondary)' }}>
                  <p>Visit ID: #{order.visit_id}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--th-text-muted)' }}>Ordered on: {new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedOrder && (
          <div className="glass-panel p-6 h-fit sticky top-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--th-text-accent)' }}>
              <CheckCircle className="w-5 h-5"/> Process Order #{selectedOrder.id}
            </h3>
            <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--th-bg-nav-active)' }}>
              <p className="font-semibold" style={{ color: 'var(--th-text-accent)' }}>{selectedOrder.test_type}</p>
              <p className="text-sm" style={{ color: 'var(--th-text-secondary)' }}>Visit ID: #{selectedOrder.visit_id}</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--th-text-secondary)' }}>Numeric / Text Results</label>
                <textarea 
                  value={resultData} onChange={e => setResultData(e.target.value)}
                  placeholder="e.g. Hemoglobin: 13.5 g/dL"
                  className="th-input w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px]"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--th-text-secondary)' }}>Upload Report (PDF/Image)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 rounded-xl transition-colors" style={{ border: '2px dashed var(--th-border-input)', backgroundColor: 'var(--th-bg-input)' }}>
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12" style={{ color: 'var(--th-text-muted)' }} />
                    <div className="flex text-sm justify-center" style={{ color: 'var(--th-text-secondary)' }}>
                      <label className="relative cursor-pointer rounded-md font-medium" style={{ color: 'var(--th-text-accent)' }}>
                        <span>Upload a file</span>
                        <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files[0])} />
                      </label>
                    </div>
                    {file && <p className="text-xs text-emerald-500 font-medium mt-2">{file.name}</p>}
                    {!file && <p className="text-xs" style={{ color: 'var(--th-text-muted)' }}>PNG, JPG, PDF up to 10MB</p>}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" disabled={uploadResultMutation.isPending}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, var(--th-brand-gradient-from), var(--th-brand-gradient-to))` }}
                >
                  {uploadResultMutation.isPending ? 'Uploading...' : 'Submit Final Results'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

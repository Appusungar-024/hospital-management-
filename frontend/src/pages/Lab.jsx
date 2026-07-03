import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, CheckCircle, Upload, Search, FileText } from 'lucide-react';
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
        headers: {
          'Content-Type': 'multipart/form-data'
        }
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
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Diagnostics Laboratory</h1>
          <p className="text-slate-500 mt-1">Process test orders and upload diagnostic results.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-600"/> Test Orders Queue
          </h3>
          
          <div className="space-y-4">
            {isLoading && <p>Loading orders...</p>}
            {orders?.length === 0 && <p className="text-slate-500 italic">No lab orders in queue.</p>}
            
            {orders?.map((order) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedOrder?.id === order.id ? 'border-indigo-500 shadow-md bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-800">{order.test_type}</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  <p>Visit ID: #{order.visit_id}</p>
                  <p className="text-xs text-slate-400 mt-1">Ordered on: {new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedOrder && (
          <div className="glass-panel p-6 h-fit sticky top-6">
            <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5"/> Process Order #{selectedOrder.id}
            </h3>
            <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
              <p className="font-semibold text-indigo-900">{selectedOrder.test_type}</p>
              <p className="text-sm text-indigo-700">Visit ID: #{selectedOrder.visit_id}</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Numeric / Text Results</label>
                <textarea 
                  value={resultData} onChange={e => setResultData(e.target.value)}
                  placeholder="e.g. Hemoglobin: 13.5 g/dL"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Report (PDF/Image)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files[0])} />
                      </label>
                    </div>
                    {file && <p className="text-xs text-emerald-600 font-medium mt-2">{file.name}</p>}
                    {!file && <p className="text-xs text-slate-500">PNG, JPG, PDF up to 10MB</p>}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" disabled={uploadResultMutation.isPending}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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

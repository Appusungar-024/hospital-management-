import { FileBarChart } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--th-text-primary)' }}>Reports</h1>
        <p className="mt-1" style={{ color: 'var(--th-text-muted)' }}>Clinical and financial report generation.</p>
      </div>
      <div className="glass-panel p-16 flex flex-col items-center justify-center text-center">
        <FileBarChart className="w-16 h-16 mb-4" style={{ color: 'var(--th-text-muted)' }} />
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--th-text-primary)' }}>Reports Coming Soon</h2>
        <p className="text-sm" style={{ color: 'var(--th-text-muted)' }}>This module is under development.</p>
      </div>
    </div>
  );
}

export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-xl ${className}`} style={{ backgroundColor: 'var(--th-bg-input)', border: '1px solid var(--th-border)' }}></div>
  );
}

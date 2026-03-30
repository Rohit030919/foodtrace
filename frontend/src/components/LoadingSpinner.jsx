export function Spinner({ size = 'md', color = 'brand' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  const colors = {
    brand: 'border-brand-500',
    white: 'border-white',
    amber: 'border-amber-400',
  };
  return (
    <div
      className={`${sizes[size]} ${colors[color]} rounded-full border-2 border-t-transparent animate-spin`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg">🌿</span>
        </div>
      </div>
      <p className="text-slate-500 text-sm font-body animate-pulse">Connecting to blockchain…</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-3">
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  );
}

import { STAGE_LABELS } from '../context/AppContext';

const STAGE_COLORS = {
  0: { dot: 'bg-brand-500', ring: 'ring-brand-500/30', text: 'text-brand-400', badge: 'bg-brand-500/10 text-brand-400 border-brand-500/30' },
  1: { dot: 'bg-blue-500',  ring: 'ring-blue-500/30',  text: 'text-blue-400',  badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  2: { dot: 'bg-amber-500', ring: 'ring-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
};

function formatTimestamp(ts) {
  if (!ts) return '—';
  const date = new Date(ts * 1000);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function truncateAddr(addr) {
  if (!addr) return '—';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function StageTimeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-4xl mb-3">📭</p>
        <p className="font-display font-semibold text-slate-400">No history found</p>
        <p className="text-sm mt-1">This batch has no recorded events yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Stage header indicators */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
        {[0, 1, 2].map((stage, i) => {
          const found = history.find(h => h.stage === stage);
          const cfg = STAGE_COLORS[stage];
          const info = STAGE_LABELS[stage];
          return (
            <div key={stage} className="flex items-center">
              <div className={`flex flex-col items-center gap-1.5 min-w-[80px]`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                  ${found ? `${cfg.dot} ring-4 ${cfg.ring}` : 'bg-slate-800 ring-2 ring-slate-700'}`}>
                  {info.icon}
                </div>
                <span className={`text-xs font-semibold font-display ${found ? cfg.text : 'text-slate-600'}`}>
                  {info.label}
                </span>
                <span className={`text-[10px] ${found ? 'text-slate-400' : 'text-slate-700'}`}>
                  {found ? '✓ Done' : 'Pending'}
                </span>
              </div>
              {i < 2 && (
                <div className={`h-px flex-1 min-w-[40px] mx-1 ${
                  history.find(h => h.stage === i + 1) ? 'bg-brand-500/50' : 'bg-slate-800'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Timeline events */}
      <div className="relative">
        {history.map((event, idx) => {
          const cfg = STAGE_COLORS[event.stage] || STAGE_COLORS[0];
          const info = STAGE_LABELS[event.stage] || { label: `Stage ${event.stage}`, icon: '📦' };
          const isLast = idx === history.length - 1;

          return (
            <div key={idx} className="relative flex gap-4 pb-6 group">
              {/* Vertical line */}
              {!isLast && (
                <div className="absolute left-[19px] top-10 bottom-0 w-px bg-gradient-to-b from-slate-600 to-transparent" />
              )}

              {/* Dot */}
              <div className="relative z-10 flex-shrink-0 mt-1">
                <div className={`w-10 h-10 rounded-full ${cfg.dot} ring-4 ${cfg.ring} flex items-center justify-center text-base shadow-lg`}>
                  {info.icon}
                </div>
              </div>

              {/* Content card */}
              <div className="flex-1 glass-card p-4 group-hover:border-slate-600/70 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-display font-bold text-base ${cfg.text}`}>
                        {info.label}
                      </span>
                      <span className={`badge border ${cfg.badge}`}>
                        Stage {event.stage}
                      </span>
                    </div>
                    <p className="text-white font-semibold mt-1 text-sm">
                      📍 {event.location}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">
                      {formatTimestamp(event.timestamp)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Handler:</span>
                  <code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                    {truncateAddr(event.handler)}
                  </code>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

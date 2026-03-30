import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, QrCode, RefreshCw, Package } from 'lucide-react';
import { getHistory, getBatch } from '../services/api';
import StageTimeline from '../components/StageTimeline';
import { PageLoader, SkeletonCard } from '../components/LoadingSpinner';

export default function BatchTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [batchInfo, setBatchInfo] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

  // ─── Fixed fetchData ───────────────────────────────────────────────────────
  // Root cause of blank screen: the old version called setLoading(false) in
  // `finally` even when a retry was scheduled via setTimeout. So loading went
  // false → blank screen, then the retry ran with no loader shown.
  //
  // Fix: don't use finally at all. Set loading=false explicitly only when
  // we are truly done (success OR final failure after all retries).
  const fetchData = useCallback(async (retry = 0) => {
    setLoading(true);
    setError(null);

    try {
      const [info, hist] = await Promise.all([
        getBatch(id),
        getHistory(id),
      ]);
      setBatchInfo(info);
      setHistory(hist);
      setLoading(false); // success — stop loading
    } catch (err) {
      if (retry < 3) {
        // Still retrying — keep loading=true so the spinner stays visible
        // Do NOT setLoading(false) here — that caused the blank screen
        setTimeout(() => fetchData(retry + 1), 1000);
      } else {
        // All retries exhausted — now stop loading and show error
        setError(err.message || 'Failed to load batch data');
        setLoading(false);
        toast.error('Could not load batch data');
      }
    }
  }, [id]);

  useEffect(() => {
    fetchData(0);
  }, [fetchData]);

  const stagesCompleted = history ? new Set(history.map(h => h.stage)).size : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors mb-8 text-sm"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
            <Package className="text-brand-400" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Batch #{id}</h1>
            <p className="text-slate-500 text-sm">Supply chain tracking — verified on blockchain</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchData(0)} className="btn-secondary py-2 px-3 text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => navigate(`/qr/${id}`)} className="btn-amber py-2 px-4 text-sm">
            <QrCode size={14} /> QR Code
          </button>
        </div>
      </div>

      {/* Loading — stays visible during ALL retries */}
      {loading && (
        <div className="space-y-4">
          <SkeletonCard />
          <PageLoader />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="glass-card border-red-500/30 p-8 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="font-display font-bold text-xl text-white mb-2">Batch Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => fetchData(0)} className="btn-primary">Retry</button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">Dashboard</button>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && batchInfo && history && (
        <div className="space-y-6 page-enter">
          <div className="glass-card p-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="badge bg-brand-500/10 text-brand-400 border border-brand-500/30">
                    🌿 On-Chain Verified
                  </span>
                  {stagesCompleted === 3 && (
                    <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      ✅ Full Journey
                    </span>
                  )}
                </div>
                <h2 className="font-display font-bold text-2xl text-white mt-1">
                  {batchInfo.name || batchInfo[1] || 'Unknown Product'}
                </h2>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <p className="text-slate-400 text-sm">
                    📍 <span className="text-white">{batchInfo.origin || batchInfo[2] || '—'}</span>
                  </p>
                  <p className="text-slate-600 text-xs font-mono">ID: #{batchInfo.id ?? id}</p>
                </div>
                {(batchInfo.currentOwner || batchInfo[3]) && (
                  <p className="text-slate-600 text-xs mt-2 font-mono">
                    Current owner: {(batchInfo.currentOwner || batchInfo[3])?.slice(0, 20)}…
                  </p>
                )}
              </div>
              <div className="flex flex-col justify-center items-start sm:items-end">
                <p className="text-slate-500 text-xs mb-1">Journey progress</p>
                <p className={`font-display font-bold text-4xl ${
                  stagesCompleted === 3 ? 'text-brand-400' :
                  stagesCompleted === 2 ? 'text-amber-400' : 'text-blue-400'
                }`}>{stagesCompleted}/3</p>
                <p className="text-slate-600 text-xs">stages complete</p>
                <div className="flex gap-1 mt-2">
                  {[0, 1, 2].map(s => (
                    <div key={s} className={`w-8 h-1.5 rounded-full ${
                      history.find(h => h.stage === s)
                        ? s === 0 ? 'bg-brand-500' : s === 1 ? 'bg-blue-500' : 'bg-amber-500'
                        : 'bg-slate-800'
                    }`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-lg text-white mb-6">
              Supply Chain Events
              <span className="ml-2 text-sm font-body text-slate-500">({history.length} recorded)</span>
            </h3>
            <StageTimeline history={history} />
          </div>

          <div className="glass-card p-4 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">⛓️</span>
            <p className="text-slate-500 text-sm leading-relaxed">
              All events above are immutably recorded on the Ethereum blockchain.
              Each entry includes a cryptographic timestamp and the wallet address of the handler —
              ensuring complete tamper-proof traceability.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, ScanLine, ArrowRight, ShieldCheck } from 'lucide-react';
import { getHistory, getBatch } from '../services/api';
import StageTimeline from '../components/StageTimeline';
import { PageLoader } from '../components/LoadingSpinner';

export default function ConsumerDashboard() {
  const navigate = useNavigate();
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [batchInfo, setBatchInfo] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!batchId || isNaN(batchId)) {
      setError('Please enter a valid numeric Batch ID');
      return;
    }
    setError('');
    setLoading(true);
    setBatchInfo(null);
    setHistory(null);
    try {
      const [info, hist] = await Promise.all([
        getBatch(batchId),
        getHistory(batchId),
      ]);
      setBatchInfo(info);
      setHistory(hist);
    } catch (err) {
      toast.error('Batch not found or network error');
      setError(err.message || 'Batch not found');
    } finally {
      setLoading(false);
    }
  };

  const completeness = history
    ? Math.min(100, Math.round((new Set(history.map(h => h.stage)).size / 3) * 100))
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 page-enter">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <ShieldCheck className="text-purple-400" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Verify Product Journey</h1>
            <p className="text-slate-500 text-sm">Enter a Batch ID or scan a QR code to trace your food</p>
          </div>
        </div>
      </div>

      {/* Search form */}
      <div className="glass-card p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="number"
              className="input-field pl-9 w-full"
              placeholder="Enter Batch ID (e.g. 1001)"
              value={batchId}
              onChange={e => { setBatchId(e.target.value); setError(''); }}
            />
          </div>
          <button type="submit" className="btn-primary flex-shrink-0" disabled={loading}>
            <Search size={16} /> Trace
          </button>
        </form>
        {error && <p className="text-red-400 text-sm mt-2 flex items-center gap-1">⚠ {error}</p>}
        <button
          onClick={() => navigate('/track')}
          className="mt-3 flex items-center gap-1.5 text-sm text-slate-500 hover:text-purple-400 transition-colors"
        >
          <ScanLine size={14} /> Or use the dedicated tracking page
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Loading */}
      {loading && <PageLoader />}

      {/* Results */}
      {batchInfo && history && !loading && (
        <div className="space-y-6 page-enter">
          {/* Batch info card */}
          <div className="glass-card p-6 border-purple-500/20">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    Batch #{batchInfo.id ?? batchId}
                  </span>
                  <span className="badge bg-brand-500/10 text-brand-400 border border-brand-500/30">
                    Verified ✓
                  </span>
                </div>
                <h2 className="font-display font-bold text-2xl text-white mt-2">
                  {batchInfo.name || batchInfo[1] || '—'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  📍 Origin: <span className="text-white">{batchInfo.origin || batchInfo[2] || '—'}</span>
                </p>
                {(batchInfo.currentOwner || batchInfo[3]) && (
                  <p className="text-slate-500 text-xs mt-1 font-mono">
                    Owner: {(batchInfo.currentOwner || batchInfo[3])?.slice(0, 10)}…
                  </p>
                )}
              </div>

              {/* Completeness meter */}
              <div className="text-right">
                <p className="text-slate-500 text-xs mb-1">Supply chain completeness</p>
                <p className={`font-display font-bold text-3xl ${
                  completeness === 100 ? 'text-brand-400' :
                  completeness >= 66 ? 'text-amber-400' : 'text-blue-400'
                }`}>{completeness}%</p>
                <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden ml-auto">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      completeness === 100 ? 'bg-brand-500' :
                      completeness >= 66 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-lg text-white mb-6">
              Supply Chain History
            </h3>
            <StageTimeline history={history} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !batchInfo && !error && (
        <div className="text-center py-12 text-slate-600">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-display text-slate-500 font-semibold">Search for a batch above</p>
          <p className="text-sm mt-1">Enter the Batch ID printed on the product or scan its QR code</p>
        </div>
      )}
    </div>
  );
}

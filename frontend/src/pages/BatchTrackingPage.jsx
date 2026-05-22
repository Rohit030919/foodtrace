import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, QrCode, RefreshCw, Package, Sprout, Truck } from 'lucide-react';
import { getHistory, getBatch } from '../services/api';
import StageTimeline from '../components/StageTimeline';
import { PageLoader, SkeletonCard } from '../components/LoadingSpinner';

// Freshness calculation
function getFreshness(expiryDate, createdAt) {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const created = new Date(createdAt);
  const totalLife = expiry - created;
  const remaining = expiry - now;
  const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
  const percentRemaining = totalLife > 0 ? (remaining / totalLife) * 100 : 0;

  if (remaining <= 0) {
    return {
      status: 'Expired',
      emoji: '🔴',
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/30',
      daysRemaining: 0,
    };
  }
  if (percentRemaining <= 30) {
    return {
      status: 'Near Expiry',
      emoji: '🟡',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      daysRemaining,
    };
  }
  return {
    status: 'Fresh',
    emoji: '🟢',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10 border-brand-500/30',
    daysRemaining,
  };
}

export default function BatchTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [batchInfo, setBatchInfo] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

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
      setLoading(false);
    } catch (err) {
      if (retry < 3) {
        setTimeout(() => fetchData(retry + 1), 1000);
      } else {
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
  const freshness = batchInfo ? getFreshness(batchInfo.expiryDate, batchInfo.createdAt) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors mb-8 text-sm"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Top bar */}
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

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <SkeletonCard />
          <PageLoader />
        </div>
      )}

      {/* Error */}
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

          {/* Main batch info card */}
          <div className="glass-card p-6">

            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="badge bg-brand-500/10 text-brand-400 border border-brand-500/30">
                🌿 On-Chain Verified
              </span>
              {stagesCompleted === 3 && (
                <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  ✅ Full Journey
                </span>
              )}
              {batchInfo.quantityMismatch && (
                <span className="badge bg-red-500/10 text-red-400 border border-red-500/30">
                  ⚠️ Quantity Mismatch
                </span>
              )}
              {freshness && (
                <span className={`badge border ${freshness.bg} ${freshness.color}`}>
                  {freshness.emoji} {freshness.status}
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {/* Left — product details */}
              <div className="sm:col-span-2">
                <h2 className="font-display font-bold text-2xl text-white">
                  {batchInfo.name || '—'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  📍 <span className="text-white">{batchInfo.origin || '—'}</span>
                </p>
                <p className="text-slate-600 text-xs font-mono mt-1">ID: #{batchInfo.id ?? id}</p>

                {/* Quantity */}
                {batchInfo.quantity && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Farmer Declared</p>
                        <p className="text-sm font-semibold text-white">
                          {batchInfo.quantity} {batchInfo.quantityUnit}
                        </p>
                      </div>
                      {batchInfo.transporterQuantityReceived && (
                        <div>
                          <p className="text-xs text-slate-500">Transporter Received</p>
                          <p className={`text-sm font-semibold ${batchInfo.quantityMismatch ? 'text-red-400' : 'text-brand-400'}`}>
                            {batchInfo.transporterQuantityReceived} {batchInfo.quantityUnit}
                            {batchInfo.quantityMismatch ? ' ⚠️' : ' ✅'}
                          </p>
                        </div>
                      )}
                    </div>
                    {batchInfo.quantityMismatch && (
                      <p className="text-red-400 text-xs mt-2">
                        ⚠️ {Number(batchInfo.quantity) - Number(batchInfo.transporterQuantityReceived)} {batchInfo.quantityUnit} unaccounted for during transport.
                      </p>
                    )}
                  </div>
                )}

                {/* Freshness details */}
                {freshness && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Best Before</p>
                        <p className="text-sm font-semibold text-white">
                          {new Date(batchInfo.expiryDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Status</p>
                        <p className={`text-sm font-semibold ${freshness.color}`}>
                          {freshness.emoji} {freshness.status}
                          {freshness.daysRemaining > 0 && (
                            <span className="text-slate-500 font-normal ml-1">
                              ({freshness.daysRemaining} days left)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right — journey progress */}
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

          {/* Farmer details card */}
          {batchInfo.farmerProfile && (
            <div className="glass-card p-5 border-brand-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sprout size={16} className="text-brand-400" />
                <h3 className="font-display font-semibold text-white text-sm">Farmer Details</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="text-sm text-white font-semibold">{batchInfo.farmerProfile.farmerName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Village</p>
                  <p className="text-sm text-white font-semibold">{batchInfo.farmerProfile.village || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Farm Location</p>
                  <p className="text-sm text-white font-semibold">{batchInfo.farmerProfile.farmLocation || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Contact</p>
                  <p className="text-sm text-white font-semibold">{batchInfo.farmerProfile.contact || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Transporter details card */}
          {batchInfo.transporterProfile && (
            <div className="glass-card p-5 border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Truck size={16} className="text-blue-400" />
                <h3 className="font-display font-semibold text-white text-sm">Transporter Details</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="text-sm text-white font-semibold">{batchInfo.transporterProfile.transporterName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Vehicle No.</p>
                  <p className="text-sm text-white font-semibold">{batchInfo.transporterProfile.vehicleNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Company</p>
                  <p className="text-sm text-white font-semibold">{batchInfo.transporterProfile.companyName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Vehicle Type</p>
                  <p className="text-sm text-white font-semibold">{batchInfo.transporterProfile.vehicleType || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">License No.</p>
                  <p className="text-sm text-white font-semibold">{batchInfo.transporterProfile.licenseNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm text-white font-semibold">{batchInfo.transporterProfile.transporterPhone || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Supply chain events */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-lg text-white mb-6">
              Supply Chain Events
              <span className="ml-2 text-sm font-body text-slate-500">({history.length} recorded)</span>
            </h3>
            <StageTimeline history={history} />
          </div>

          {/* Blockchain note */}
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
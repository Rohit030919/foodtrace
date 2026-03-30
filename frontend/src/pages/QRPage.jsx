import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, ArrowLeft, QrCode, ExternalLink } from 'lucide-react';
import { getQR } from '../services/api';
import { PageLoader } from '../components/LoadingSpinner';

export default function QRPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputId, setInputId] = useState(id || '');

  const fetchQR = async (batchId) => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    setQrUrl(null);
    try {
      const url = await getQR(batchId);
      setQrUrl(url);
    } catch (err) {
      setError(err.message || 'Failed to generate QR');
      toast.error('Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchQR(id);
    else setLoading(false);
  }, [id]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `foodtrace-batch-${id || inputId}.png`;
    a.click();
    toast.success('QR code downloaded!');
  };

  const handleManualFetch = (e) => {
    e.preventDefault();
    if (!inputId || isNaN(inputId)) {
      toast.error('Enter a valid Batch ID');
      return;
    }
    navigate(`/qr/${inputId}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors mb-8 text-sm"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <QrCode className="text-amber-400" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">
              {id ? `QR Code — Batch #${id}` : 'Generate QR Code'}
            </h1>
            <p className="text-slate-500 text-sm">Scan to verify the full supply chain journey</p>
          </div>
        </div>
      </div>

      {/* If no ID, show input form */}
      {!id && (
        <div className="glass-card p-6 mb-6">
          <form onSubmit={handleManualFetch} className="flex gap-3">
            <input
              type="number"
              className="input-field flex-1"
              placeholder="Enter Batch ID"
              value={inputId}
              onChange={e => setInputId(e.target.value)}
            />
            <button type="submit" className="btn-amber flex-shrink-0">
              <QrCode size={16} /> Generate
            </button>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && <PageLoader />}

      {/* Error */}
      {error && !loading && (
        <div className="glass-card border-red-500/30 p-6 text-center">
          <p className="text-4xl mb-3">❌</p>
          <p className="text-red-400 font-semibold">Failed to generate QR</p>
          <p className="text-slate-500 text-sm mt-1">{error}</p>
          <button className="btn-secondary mt-4 mx-auto" onClick={() => fetchQR(id)}>
            Try Again
          </button>
        </div>
      )}

      {/* QR Display */}
      {qrUrl && !loading && (
        <div className="space-y-4 page-enter">
          <div className="glass-card p-8 flex flex-col items-center">
            {/* QR container */}
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500/10 rounded-2xl blur-xl" />
              <div className="relative bg-white p-4 rounded-2xl shadow-2xl">
                <img
                  src={qrUrl}
                  alt={`QR for batch ${id}`}
                  className="w-56 h-56 object-contain"
                />
              </div>
              {/* Corner decorations */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-brand-500 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-brand-500 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-brand-500 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-brand-500 rounded-br-lg" />
            </div>

            <div className="mt-6 text-center">
              <p className="font-display font-bold text-white text-lg">Batch #{id}</p>
              <p className="text-slate-500 text-sm mt-1">
                Scan this QR to view the full supply chain
              </p>
              <p className="text-slate-600 text-xs mt-1 font-mono">
                {window.location.origin}/batch/{id}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 flex-wrap justify-center">
              <button onClick={handleDownload} className="btn-amber">
                <Download size={16} /> Download QR
              </button>
              <button
                onClick={() => navigate(`/batch/${id}`)}
                className="btn-secondary"
              >
                <ExternalLink size={16} /> View Tracking
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="glass-card p-4">
            <p className="text-slate-500 text-sm">
              💡 <strong className="text-slate-400">Tip:</strong> Print and attach this QR to the physical packaging.
              Consumers can scan it to view the verified supply chain journey on the blockchain.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

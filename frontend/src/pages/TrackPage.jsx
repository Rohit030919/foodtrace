import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, ArrowRight, X, ArrowLeft } from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function TrackPage() {
  const [batchId, setBatchId] = useState('');
  const [error, setError] = useState('');
  const [scanMode, setScanMode] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const navigate = useNavigate();

  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);

  const backPath = '/dashboard';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!batchId.trim()) {
      setError('Please enter a Batch ID');
      return;
    }
    navigate(`/batch/${batchId.trim()}`);
  };

  const safeStop = async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_) {}
      finally {
        isRunningRef.current = false;
      }
    }
  };

  const stopScan = async () => {
    await safeStop();
    setScanMode(false);
    setCameraError('');
  };

  useEffect(() => {
    if (!scanMode) return;

    let cancelled = false;

    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (cancelled) return;
        if (!devices || devices.length === 0) {
          setCameraError('No camera found on this device.');
          setScanMode(false);
          return;
        }

        return scanner.start(
          devices[0].id,
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            isRunningRef.current = true;
            safeStop().then(() => {
              if (!cancelled) {
                // Extract batch ID from full URL if needed
                let id = decodedText.trim();
                if (id.includes('/batch/')) {
                  id = id.split('/batch/').pop().split('?')[0].split('#')[0].trim();
                }
                navigate(`/batch/${id}`);
              }
            });
          },
          () => {}
        ).then(() => {
          if (!cancelled) {
            isRunningRef.current = true;
          } else {
            scanner.stop().catch(() => {});
          }
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setCameraError('Camera access denied or unavailable.');
          setScanMode(false);
          console.error('Camera error:', err);
        }
      });

    return () => {
      cancelled = true;
      if (isRunningRef.current) {
        scanner.stop().catch(() => {});
        isRunningRef.current = false;
      }
    };
  }, [scanMode]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md page-enter">

        {/* Back button — role-aware */}
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-4">
            <ScanLine className="text-brand-400" size={28} />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Track a Batch</h1>
          <p className="text-slate-500 mt-2 text-sm">Enter Batch ID or scan QR</p>
        </div>

        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Batch ID</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. roh-ap1-xw3k"
                value={batchId}
                onChange={e => { setBatchId(e.target.value); setError(''); }}
                autoFocus
              />
              {error && <p className="text-red-400 text-xs mt-1.5">⚠ {error}</p>}
            </div>
            <button type="submit" className="btn-primary w-full">
              View Supply Chain <ArrowRight size={16} />
            </button>
          </form>

          {cameraError && (
            <p className="text-red-400 text-xs mt-3 text-center">⚠ {cameraError}</p>
          )}

          {!scanMode ? (
            <button onClick={() => { setCameraError(''); setScanMode(true); }} className="btn-secondary w-full mt-4">
              <ScanLine size={15} /> Scan QR Code
            </button>
          ) : (
            <button onClick={stopScan} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-sm font-semibold">
              <X size={15} /> Stop Scanner
            </button>
          )}

          {scanMode && (
            <div className="mt-4">
              <div id="reader" className="rounded-xl overflow-hidden" />
              <p className="text-slate-600 text-xs text-center mt-2">
                Point camera at the FoodTrace QR code
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          All data is fetched directly from the Ethereum blockchain
        </p>
      </div>
    </div>
  );
}
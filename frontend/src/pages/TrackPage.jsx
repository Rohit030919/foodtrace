import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, ArrowRight, X } from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function TrackPage() {
  const [batchId, setBatchId] = useState('');
  const [error, setError] = useState('');
  const [scanMode, setScanMode] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const navigate = useNavigate();

  const scannerRef = useRef(null);
  const isRunningRef = useRef(false); // ← tracks if scanner.start() actually completed

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!batchId || isNaN(batchId)) {
      setError('Please enter a valid numeric Batch ID');
      return;
    }
    navigate(`/batch/${batchId}`);
  };

  // Safe stop — only calls stop() if scanner actually started
  const safeStop = async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_) {
        // Already stopped — ignore
      } finally {
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

    let cancelled = false; // prevents acting on results after unmount

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
            // QR scanned successfully
            isRunningRef.current = true; // it was running when we got here
            safeStop().then(() => {
              if (!cancelled) {
                const parts = decodedText.split('/');
                const id = parts[parts.length - 1];
                navigate(`/batch/${id}`);
              }
            });
          },
          () => { /* scan errors are per-frame, ignore them */ }
        ).then(() => {
          // scanner.start() resolved — it is now actually running
          if (!cancelled) {
            isRunningRef.current = true;
          } else {
            // Component unmounted before start finished — stop immediately
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
      // Only stop if we know it started — this is what was crashing before
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
                type="number"
                className="input-field"
                placeholder="e.g. 1001"
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

          {/* Camera error */}
          {cameraError && (
            <p className="text-red-400 text-xs mt-3 text-center">⚠ {cameraError}</p>
          )}

          {/* Scan toggle */}
          {!scanMode ? (
            <button onClick={() => { setCameraError(''); setScanMode(true); }} className="btn-secondary w-full mt-4">
              <ScanLine size={15} /> Scan QR Code
            </button>
          ) : (
            <button onClick={stopScan} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-sm font-semibold">
              <X size={15} /> Stop Scanner
            </button>
          )}

          {/* Camera view — only rendered when scanMode is true */}
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

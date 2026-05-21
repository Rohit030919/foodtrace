import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onClose }) {
  const html5QrRef = useRef(null);
  const scannedRef = useRef(false);
  const stoppedRef = useRef(false);

  const stopScanner = async () => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    try {
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        await html5QrRef.current.stop();
      }
    } catch (e) {
      // ignore — scanner may already be stopped
    }
  };

  useEffect(() => {
    const html5Qr = new Html5Qrcode("qr-reader");
    html5QrRef.current = html5Qr;

    html5Qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        // Prevent double-fire
        if (scannedRef.current) return;
        scannedRef.current = true;

        // Extract batch ID — QR contains full URL
        // e.g. https://foodtrace-omega.vercel.app/batch/roh-ap1-xw3k
        let batchId = decodedText.trim();
        if (batchId.includes('/batch/')) {
          batchId = batchId.split('/batch/').pop().split('?')[0].split('#')[0].trim();
        }

        await stopScanner();
        onScan(batchId);
        onClose();
      },
      () => {} // ignore per-frame errors
    ).catch((err) => {
      console.error("QR start error:", err);
    });

    return () => {
      stopScanner();
    };
  }, []);

  const handleCancel = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-card p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-white">Scan Batch QR</h3>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Scanner container */}
        <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />

        <p className="text-slate-500 text-xs text-center mt-4">
          Point camera at the batch QR code
        </p>
      </div>
    </div>
  );
}
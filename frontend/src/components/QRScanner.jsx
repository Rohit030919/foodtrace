import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    const html5Qr = new Html5Qrcode("qr-reader");
    html5QrRef.current = html5Qr;

    html5Qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // Extract batch ID from URL if QR contains full URL
        // e.g. https://foodtrace-omega.vercel.app/batch/roh-ap1-xw3k
        let batchId = decodedText;
        if (decodedText.includes('/batch/')) {
          batchId = decodedText.split('/batch/')[1];
        }
        onScan(batchId);
        html5Qr.stop().catch(() => {});
        onClose();
      },
      () => {} // ignore frame errors
    ).catch((err) => {
      console.error("QR start error:", err);
    });

    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-card p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-white">Scan Batch QR</h3>
          <button
            onClick={() => {
              if (html5QrRef.current) {
                html5QrRef.current.stop().catch(() => {});
              }
              onClose();
            }}
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
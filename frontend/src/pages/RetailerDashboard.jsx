import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Store, MapPin, CheckCircle2, Loader, ScanLine } from 'lucide-react';
import { Spinner } from '../components/LoadingSpinner';
import { useApp } from '../context/AppContext';
import QRScanner from '../components/QRScanner';

const BASE_URL = "https://foodtrace-backend.onrender.com";

export default function RetailerDashboard() {
  const { userProfile } = useApp();
  const navigate = useNavigate();

  const [showScanner, setShowScanner] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [batchVerified, setBatchVerified] = useState(false);
  const [batchInfo, setBatchInfo] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const [location, setLocation] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    setLocation('');

    if (!navigator.geolocation) {
      setLocationError('GPS not supported on this device');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const addr = data.address;
          const parts = [
            addr.village || addr.town || addr.city || addr.suburb,
            addr.district || addr.county,
            addr.state,
          ].filter(Boolean);
          setLocation(parts.join(', '));
        } catch {
          setLocationError('Could not convert GPS to address. Try again.');
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === 1) {
          setLocationError('Location permission denied. Please allow GPS access.');
        } else {
          setLocationError('Could not get location. Try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const verifyBatch = async () => {
    if (!batchId.trim()) {
      toast.error('Please enter a Batch ID');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(`${BASE_URL}/getBatch/${batchId.trim()}`);
      if (!res.ok) {
        toast.error('Batch ID does not exist. Check the ID and try again.');
        setBatchVerified(false);
        setBatchInfo(null);
        return;
      }
      const data = await res.json();
      setBatchInfo(data);
      setBatchVerified(true);
      toast.success('Batch verified ✅');
    } catch {
      toast.error('Error verifying batch');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!batchVerified) {
      toast.error('Please verify the batch ID first');
      return;
    }
    if (!location) {
      toast.error('GPS location is required. Please allow location access.');
      return;
    }
    if (!userProfile) {
      toast.error('Profile not loaded. Please logout and login again.');
      return;
    }

    const fullLocation = `${userProfile.shopName}, ${userProfile.shopAddress}, ${location}`;
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/updateBatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: batchId.trim(),
          stage: 2,
          location: fullLocation
        })
      });

      if (!res.ok) {
        const msg = await res.text();
        toast.error(msg);
        return;
      }

      setLastUpdate({ id: batchId, location: fullLocation });
      setSuccess(true);
      toast.success(`Retail arrival recorded for Batch ${batchId} 🏪`);
      setBatchId('');
      setBatchVerified(false);
      setBatchInfo(null);

    } catch (err) {
      toast.error(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors mb-6 text-sm"
      >
        <ArrowLeft size={15} /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-8 page-enter">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Store className="text-amber-400" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Retailer Dashboard</h1>
            <p className="text-slate-500 text-sm">Confirm batch arrival — details auto-filled from your profile</p>
          </div>
        </div>
      </div>

      {/* Auto-filled retailer profile card */}
      {userProfile && (
        <div className="glass-card p-4 mb-6 border-amber-500/20">
          <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">
            Your Shop Details (Auto-filled)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-500">Shop Name</p>
              <p className="text-sm text-white font-semibold">{userProfile.shopName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Owner Name</p>
              <p className="text-sm text-white font-semibold">{userProfile.retailerName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm text-white font-semibold">{userProfile.retailerPhone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Address</p>
              <p className="text-sm text-white font-semibold">{userProfile.shopAddress || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">City</p>
              <p className="text-sm text-white font-semibold">{userProfile.city || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">State</p>
              <p className="text-sm text-white font-semibold">{userProfile.state || '—'}</p>
            </div>
          </div>

          {/* GPS region */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
            <MapPin size={13} className="text-amber-400" />
            {locationLoading ? (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Loader size={11} className="animate-spin" /> Detecting GPS location...
              </span>
            ) : location ? (
              <span className="text-xs text-slate-400">
                GPS Region: <strong className="text-white">{location}</strong>
                <button type="button" onClick={detectLocation} className="ml-2 text-amber-400 hover:text-amber-300 text-xs">
                  Refresh
                </button>
              </span>
            ) : (
              <span className="text-xs text-red-400">
                {locationError || 'Location not detected'}
                <button type="button" onClick={detectLocation} className="ml-2 text-amber-400 hover:text-amber-300">
                  Retry
                </button>
              </span>
            )}
          </div>
          <p className="text-xs text-amber-400/70 mt-2">✅ All details auto-filled — no manual entry needed</p>
        </div>
      )}

      {/* Status indicator */}
      <div className="glass-card p-4 mb-6 flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
        <p className="text-sm text-slate-400">
          Stage <strong className="text-amber-400">2 — Retail</strong> updates will be written to the blockchain
        </p>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-lg text-white mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-amber-500 inline-block" />
          Confirm Batch Arrival
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Batch ID + Scan + Verify */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Batch ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Scan QR or type ID"
                value={batchId}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  setBatchVerified(false);
                  setBatchInfo(null);
                }}
              />
              {/* Scan QR button */}
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1"
              >
                <ScanLine size={16} /> Scan
              </button>
              <button
                type="button"
                onClick={verifyBatch}
                disabled={verifying}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {verifying ? <Loader size={14} className="animate-spin" /> : 'Verify'}
              </button>
            </div>

            {batchVerified && batchInfo && (
              <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-400 text-sm font-semibold">✅ Batch Verified</p>
                <p className="text-slate-400 text-xs mt-1">
                  <strong className="text-white">{batchInfo.name}</strong> — Origin: {batchInfo.origin}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !batchVerified || locationLoading || !location}
          >
            {loading
              ? <><Spinner size="sm" color="white" /> Broadcasting Transaction…</>
              : <><Store size={16} /> Confirm Retail Arrival</>}
          </button>
        </form>
      </div>

      {/* Success */}
      {success && lastUpdate && (
        <div className="mt-6 glass-card border-amber-500/30 p-6 page-enter">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="text-amber-400" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-amber-400 text-lg">Retail Arrival Logged!</h3>
              <p className="text-slate-400 text-sm mt-1">
                Batch <strong className="text-white">{lastUpdate.id}</strong> recorded at{' '}
                <strong className="text-white">{lastUpdate.location}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 glass-card p-4">
        <h3 className="font-display font-semibold text-slate-400 text-sm mb-2">🏪 Retailer Role</h3>
        <ul className="space-y-1.5 text-sm text-slate-500">
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">01.</span> Your shop details are auto-filled from your registered profile</li>
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">02.</span> Scan the QR code or enter Batch ID manually and verify</li>
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">03.</span> Click Confirm — everything is recorded automatically</li>
        </ul>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={(scannedId) => {
            setBatchId(scannedId);
            setBatchVerified(false);
            setBatchInfo(null);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

    </div>
  );
}
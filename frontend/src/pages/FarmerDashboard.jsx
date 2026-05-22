import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sprout, QrCode, CheckCircle2, MapPin, Tag, Loader, Package, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';

const BASE_URL = "https://foodtrace-backend.onrender.com";

export default function FarmerDashboard() {
  const { setLastCreatedBatch } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    farmAddress: '',
    quantity: '',
    quantityUnit: 'kg',
    assignedTransporter: '',
    expiryDate: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [created, setCreated] = useState(null);

  const [location, setLocation] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [transporters, setTransporters] = useState([]);

  useEffect(() => {
    detectLocation();
    fetchTransporters();
  }, []);

  const fetchTransporters = async () => {
    try {
      const res = await fetch(`${BASE_URL}/getTransporters`);
      if (res.ok) {
        const data = await res.json();
        setTransporters(data);
      }
    } catch {
      // silently fail — transporter assignment becomes optional
    }
  };

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

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!location) errs.location = 'Location is required. Please allow GPS access.';
    if (!form.farmAddress || !form.farmAddress.trim()) errs.farmAddress = 'Specific farm address is required';
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0)
      errs.quantity = 'Valid quantity is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const farmerUsername = localStorage.getItem("username");
      const fullOrigin = `${form.farmAddress}, ${location}`;

      const res = await fetch(`${BASE_URL}/createBatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          origin: fullOrigin,
          farmerUsername,
          quantity: Number(form.quantity),
          quantityUnit: form.quantityUnit,
          assignedTransporter: form.assignedTransporter || null,
          expiryDate: form.expiryDate || null,
        })
      });

      if (!res.ok) {
        const msg = await res.text();
        toast.error(msg);
        return;
      }

      const data = await res.json();
      setCreated({ name: form.name, origin: fullOrigin, id: data.stringId });
      setLastCreatedBatch({ name: form.name, origin: fullOrigin, id: data.stringId });
      setSuccess(true);
      toast.success(`Batch ${data.stringId} created on-chain! 🌿`);
      setForm({ name: '', farmAddress: '', quantity: '', quantityUnit: 'kg', assignedTransporter: '', expiryDate: '' });

    } catch (err) {
      toast.error(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const change = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8 page-enter">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
            <Sprout className="text-brand-400" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Farmer Dashboard</h1>
            <p className="text-slate-500 text-sm">Register a new produce batch on the blockchain</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2 glass-card p-6">
          <h2 className="font-display font-semibold text-lg text-white mb-5 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-brand-500 inline-block" />
            Create New Batch
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Product Name */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Product Name</label>
              <div className="relative">
                <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  className={`input-field pl-9 w-full ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g. Alphonso Mangoes"
                  value={form.name}
                  onChange={change('name')}
                />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Quantity + Unit */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Quantity</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Package size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    className={`input-field pl-9 w-full ${errors.quantity ? 'border-red-500' : ''}`}
                    placeholder="e.g. 50"
                    value={form.quantity}
                    onChange={change('quantity')}
                    min="0"
                  />
                </div>
                <select
                  className="input-field w-24"
                  value={form.quantityUnit}
                  onChange={change('quantityUnit')}
                >
                  <option value="kg">kg</option>
                  <option value="tonnes">tonnes</option>
                  <option value="pieces">pieces</option>
                  <option value="boxes">boxes</option>
                  <option value="crates">crates</option>
                </select>
              </div>
              {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
              <p className="text-slate-600 text-xs mt-1">📦 Transporter will verify this quantity on pickup</p>
            </div>

            {/* GPS Region */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Region (Auto-detected via GPS)
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                {locationLoading && (
                  <Loader size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
                )}
                {!locationLoading && (
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-400 hover:text-brand-300"
                  >
                    {location ? 'Refresh' : 'Retry'}
                  </button>
                )}
                <input
                  type="text"
                  className="input-field pl-9 pr-16 w-full bg-slate-800/50 cursor-not-allowed text-slate-300"
                  placeholder={locationLoading ? "Detecting location..." : "Detecting..."}
                  value={location}
                  disabled
                  readOnly
                />
              </div>
              {locationError && <p className="text-red-400 text-xs mt-1">{locationError}</p>}
              {errors.location && !locationError && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
              <p className="text-slate-600 text-xs mt-1">📍 Auto-detected — cannot be changed</p>
            </div>

            {/* Manual Farm Address */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Specific Farm Address</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  className={`input-field pl-9 w-full ${errors.farmAddress ? 'border-red-500' : ''}`}
                  placeholder="e.g. Plot 12, Near Gram Panchayat, Dhayari"
                  value={form.farmAddress || ''}
                  onChange={change('farmAddress')}
                />
              </div>
              {errors.farmAddress && <p className="text-red-400 text-xs mt-1">{errors.farmAddress}</p>}
              <p className="text-slate-600 text-xs mt-1">✏️ Enter your specific farm address manually</p>
            </div>
                {/* Expiry Date */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Best Before / Expiry Date
              </label>
              <input
                type="date"
                className={`input-field w-full ${errors.expiryDate ? 'border-red-500' : ''}`}
                value={form.expiryDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={change('expiryDate')}
              />
              {errors.expiryDate && <p className="text-red-400 text-xs mt-1">{errors.expiryDate}</p>}
              <p className="text-slate-600 text-xs mt-1">
                📅 Consumers will see freshness status based on this date
              </p>
            </div>
            {/* Assign Transporter */}
            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Assign Transporter <span className="text-slate-600">(optional)</span>
              </label>
              <div className="relative">
                <Truck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  className="input-field pl-9 w-full"
                  value={form.assignedTransporter}
                  onChange={change('assignedTransporter')}
                >
                  <option value="">— No transporter assigned yet —</option>
                  {transporters.map((t) => (
                    <option key={t.username} value={t.username}>
                      {t.transporterName || t.username}
                      {t.vehicleNumber ? ` | ${t.vehicleNumber}` : ''}
                      {t.companyName ? ` | ${t.companyName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-slate-600 text-xs mt-1">
                🚛 Assigned transporter will see a notification on their dashboard
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={loading || locationLoading || !location}
            >
              {loading
                ? 'Broadcasting Transaction…'
                : <><Sprout size={16} className="inline mr-2" />Register Batch on Blockchain</>
              }
            </button>
          </form>
        </div>

        {/* Success state */}
        {success && created && (
          <div className="sm:col-span-2 glass-card border-brand-500/30 p-6 page-enter">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="text-brand-400" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-brand-400 text-lg">
                  Batch Registered Successfully!
                </h3>
                <p className="text-slate-400 text-sm mt-1 mb-1">Your batch ID is:</p>
                <p className="text-white font-mono text-lg font-bold mb-4">{created.id}</p>
                <p className="text-slate-400 text-sm mb-4">
                  <strong className="text-white">{created.name}</strong> from{' '}
                  <strong className="text-white">{created.origin}</strong> is now live on-chain.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-amber" onClick={() => navigate(`/qr/${created.id}`)}>
                    <QrCode size={16} className="inline mr-2" /> Generate QR Code
                  </button>
                  <button className="btn-secondary" onClick={() => navigate(`/batch/${created.id}`)}>
                    View Tracking Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 glass-card p-4">
        <h3 className="font-display font-semibold text-slate-400 text-sm mb-2">📋 How it works</h3>
        <ul className="space-y-1.5 text-sm text-slate-500">
          <li className="flex items-start gap-2"><span className="text-brand-500 mt-0.5">01.</span> Allow GPS access when prompted</li>
          <li className="flex items-start gap-2"><span className="text-brand-500 mt-0.5">02.</span> Enter product name, quantity and farm address</li>
          <li className="flex items-start gap-2"><span className="text-brand-500 mt-0.5">03.</span> Optionally assign a transporter for this batch</li>
          <li className="flex items-start gap-2"><span className="text-brand-500 mt-0.5">04.</span> A unique Batch ID is auto-generated for you</li>
          <li className="flex items-start gap-2"><span className="text-brand-500 mt-0.5">05.</span> Generate a QR code to share with your transporter</li>
        </ul>
      </div>
    </div>
  );
}
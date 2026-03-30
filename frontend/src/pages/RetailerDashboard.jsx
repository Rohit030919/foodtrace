import { useState } from 'react';
import toast from 'react-hot-toast';
import { Store, Hash, MapPin, CheckCircle2 } from 'lucide-react';
import { updateBatch } from '../services/api';
import FormField from '../components/FormField';
import { Spinner } from '../components/LoadingSpinner';

export default function RetailerDashboard() {
  const [form, setForm] = useState({ id: '', location: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const validate = () => {
    const errs = {};
    if (!form.id || isNaN(form.id)) errs.id = 'Valid numeric batch ID required';
    if (!form.location.trim()) errs.location = 'Store name is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await updateBatch({ id: form.id, stage: 2, location: form.location });
      setLastUpdate({ ...form });
      setSuccess(true);
      toast.success(`Retail arrival recorded for Batch #${form.id} 🏪`);
      setForm({ id: '', location: '' });
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
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Store className="text-amber-400" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Retailer Dashboard</h1>
            <p className="text-slate-500 text-sm">Confirm batch arrival and log your store details</p>
          </div>
        </div>
      </div>

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
          <FormField label="Batch ID" id="batch-id" error={errors.id} hint="Scan QR or enter batch ID manually">
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="batch-id"
                type="number"
                className="input-field pl-9"
                placeholder="e.g. 1001"
                value={form.id}
                onChange={change('id')}
              />
            </div>
          </FormField>

          <FormField label="Store Name / Retail Location" id="location" error={errors.location}>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="location"
                type="text"
                className="input-field pl-9"
                placeholder="e.g. Reliance Fresh, Baner Pune"
                value={form.location}
                onChange={change('location')}
              />
            </div>
          </FormField>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            disabled={loading}
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
                Batch <strong className="text-white">#{lastUpdate.id}</strong> is now recorded at{' '}
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
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">01.</span> Receive the batch from the transporter with its QR code</li>
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">02.</span> Enter the Batch ID and your store name</li>
          <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">03.</span> Submit to record Stage 2 (Retail) — customers can now verify the full journey</li>
        </ul>
      </div>
    </div>
  );
}

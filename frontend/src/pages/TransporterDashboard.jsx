import { useState } from 'react';
import toast from 'react-hot-toast';
import { Truck, Hash, MapPin, CheckCircle2 } from 'lucide-react';
import { updateBatch } from '../services/api';
import FormField from '../components/FormField';
import { Spinner } from '../components/LoadingSpinner';

export default function TransporterDashboard() {
  const [form, setForm] = useState({ id: '', location: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const validate = () => {
    const errs = {};
    if (!form.id || isNaN(form.id)) errs.id = 'Valid numeric batch ID required';
    if (!form.location.trim()) errs.location = 'Current location is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await updateBatch({ id: form.id, stage: 1, location: form.location });
      setLastUpdate({ ...form });
      setSuccess(true);
      toast.success(`Transport update recorded for Batch #${form.id} 🚛`);
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
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
            <Truck className="text-blue-400" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Transporter Dashboard</h1>
            <p className="text-slate-500 text-sm">Log transport events and current batch location</p>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="glass-card p-4 mb-6 flex items-center gap-3">
        <div className="dot-active" />
        <p className="text-sm text-slate-400">
          Stage <strong className="text-blue-400">1 — Transport</strong> updates will be written to the blockchain
        </p>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display font-semibold text-lg text-white mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-blue-500 inline-block" />
          Log Transport Event
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Batch ID" id="batch-id" error={errors.id} hint="ID of the batch being transported">
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

          <FormField label="Current Location / Checkpoint" id="location" error={errors.location}>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="location"
                type="text"
                className="input-field pl-9"
                placeholder="e.g. Mumbai Depot, NH-48"
                value={form.location}
                onChange={change('location')}
              />
            </div>
          </FormField>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0" disabled={loading}>
            {loading
              ? <><Spinner size="sm" color="white" /> Broadcasting Transaction…</>
              : <><Truck size={16} /> Log Transport Update</>}
          </button>
        </form>
      </div>

      {/* Success */}
      {success && lastUpdate && (
        <div className="mt-6 glass-card border-blue-500/30 p-6 page-enter">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-blue-400 text-lg">Transport Logged!</h3>
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
        <h3 className="font-display font-semibold text-slate-400 text-sm mb-2">🚛 Transporter Role</h3>
        <ul className="space-y-1.5 text-sm text-slate-500">
          <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">01.</span> Scan or enter the Batch ID from the farmer's QR code</li>
          <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">02.</span> Enter your current checkpoint or delivery hub location</li>
          <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">03.</span> Submit to record Stage 1 (Transport) on the blockchain</li>
        </ul>
      </div>
    </div>
  );
}

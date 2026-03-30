import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sprout, QrCode, CheckCircle2, Hash, MapPin, Tag } from 'lucide-react';
import { createBatch } from '../services/api';
import { useApp } from '../context/AppContext';
import FormField from '../components/FormField';
import { Spinner } from '../components/LoadingSpinner';

export default function FarmerDashboard() {
  const { setLastCreatedBatch } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({ id: '', name: '', origin: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [created, setCreated] = useState(null);

  const validate = () => {
    const errs = {};
    if (!form.id || isNaN(form.id)) errs.id = 'Valid numeric ID required';
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.origin.trim()) errs.origin = 'Origin is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await createBatch({ id: form.id, name: form.name, origin: form.origin });
      setCreated({ ...form });
      setLastCreatedBatch({ ...form });
      setSuccess(true);
      toast.success(`Batch #${form.id} created on-chain! 🌿`);
      setForm({ id: '', name: '', origin: '' });
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
        {/* Form card */}
        <div className="sm:col-span-2 glass-card p-6">
          <h2 className="font-display font-semibold text-lg text-white mb-5 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-brand-500 inline-block" />
            Create New Batch
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Batch ID" id="batch-id" error={errors.id} hint="Unique numeric identifier">
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

              <FormField label="Product Name" id="product-name" error={errors.name}>
                <div className="relative">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="product-name"
                    type="text"
                    className="input-field pl-9"
                    placeholder="e.g. Alphonso Mangoes"
                    value={form.name}
                    onChange={change('name')}
                  />
                </div>
              </FormField>
            </div>

            <FormField label="Origin / Farm Location" id="origin" error={errors.origin}>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="origin"
                  type="text"
                  className="input-field pl-9"
                  placeholder="e.g. Ratnagiri, Maharashtra"
                  value={form.origin}
                  onChange={change('origin')}
                />
              </div>
            </FormField>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? <><Spinner size="sm" color="white" /> Broadcasting Transaction…</> : <><Sprout size={16} /> Register Batch on Blockchain</>}
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
                <p className="text-slate-400 text-sm mt-1 mb-4">
                  Batch <strong className="text-white">#{created.id}</strong> — <strong className="text-white">{created.name}</strong> from {created.origin} is now live on-chain.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="btn-amber"
                    onClick={() => navigate(`/qr/${created.id}`)}
                  >
                    <QrCode size={16} /> Generate QR Code
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => navigate(`/batch/${created.id}`)}
                  >
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
          <li className="flex items-start gap-2"><span className="text-brand-500 mt-0.5">01.</span> Assign a unique ID to each produce batch</li>
          <li className="flex items-start gap-2"><span className="text-brand-500 mt-0.5">02.</span> Submit — the transaction is signed and written to the blockchain</li>
          <li className="flex items-start gap-2"><span className="text-brand-500 mt-0.5">03.</span> Generate a QR code to share with transporters and retailers</li>
        </ul>
      </div>
    </div>
  );
}

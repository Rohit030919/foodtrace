import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { setRole } = useApp();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        setError("Invalid username or password");
        return;
      }

      const data = await res.json();
      setRole(data.role);
      navigate("/dashboard");

    } catch (err) {
      setError("Server error");
    }
  };

  // REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        setError("User already exists");
        return;
      }

      setMessage("Registered successfully! Please login.");
      setIsRegister(false);
      setUsername('');
      setPassword('');

    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative">

      {/* Background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-semibold mb-6">
          <ShieldCheck size={15} />
          Blockchain-Verified Supply Chain
        </div>
        <h1 className="text-5xl font-bold text-white">
          Food<span className="text-brand-400">Trace</span>
        </h1>
        <p className="mt-4 text-slate-400">
          {isRegister ? "Create a consumer account" : "Login to continue"}
        </p>
      </div>

      {/* Form */}
      <div className="glass-card p-6 w-full max-w-md">
        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">

          <input
            type="text"
            placeholder="Username"
            className="input-field"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
          />

          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {message && <p className="text-green-400 text-sm">{message}</p>}

          <button className="btn-primary w-full">
            {isRegister ? "Register" : "Login"}
          </button>

        </form>

        {/* Toggle */}
        <p className="text-sm text-slate-400 mt-4 text-center">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <span
            className="text-brand-400 cursor-pointer ml-1"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setMessage('');
            }}
          >
            {isRegister ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}
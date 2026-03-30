import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export const ROLES = {
  FARMER: 'farmer',
  TRANSPORTER: 'transporter',
  RETAILER: 'retailer',
  CONSUMER: 'consumer',
};

export const ROLE_CONFIG = {
  farmer: {
    label: 'Farmer',
    emoji: '🌾',
    colorClass: 'text-brand-400',
    bgClass: 'bg-brand-500/10',
    borderClass: 'border-brand-500/30',
    activeBg: 'bg-brand-500',
    description: 'Create & register produce batches on-chain',
    stage: 0,
  },
  transporter: {
    label: 'Transporter',
    emoji: '🚛',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    activeBg: 'bg-blue-500',
    description: 'Log transport & movement events',
    stage: 1,
  },
  retailer: {
    label: 'Retailer',
    emoji: '🏪',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    activeBg: 'bg-amber-500',
    description: 'Receive & list products for sale',
    stage: 2,
  },
  consumer: {
    label: 'Consumer',
    emoji: '👤',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
    activeBg: 'bg-purple-500',
    description: 'Verify product authenticity & journey',
    stage: null,
  },
};

export const STAGE_LABELS = {
  0: { label: 'Farm', icon: '🌾', color: 'brand' },
  1: { label: 'Transport', icon: '🚛', color: 'blue' },
  2: { label: 'Retail', icon: '🏪', color: 'amber' },
};

export function AppProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('ft_role') || null);
  const [darkMode, setDarkMode] = useState(true);
  const [lastCreatedBatch, setLastCreatedBatch] = useState(null);

  useEffect(() => {
    if (role) localStorage.setItem('ft_role', role);
    else localStorage.removeItem('ft_role');
  }, [role]);

  useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  }, [darkMode]);

  const logout = () => {
    setRole(null);
    setLastCreatedBatch(null);
  };

  return (
    <AppContext.Provider value={{
      role, setRole,
      darkMode, setDarkMode,
      lastCreatedBatch, setLastCreatedBatch,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProtectedRoute({ children }) {
  const { role } = useApp();
  if (!role) return <Navigate to="/" replace />;
  return children;
}

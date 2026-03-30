import { useApp } from '../context/AppContext';
import FarmerDashboard from './FarmerDashboard';
import TransporterDashboard from './TransporterDashboard';
import RetailerDashboard from './RetailerDashboard';
import ConsumerDashboard from './ConsumerDashboard';
import AdminDashboard from "./AdminDashboard";

export default function Dashboard() {
  const { role } = useApp();

  const dashboards = {
    admin: <AdminDashboard/>,
    farmer: <FarmerDashboard />,
    transporter: <TransporterDashboard />,
    retailer: <RetailerDashboard />,
    consumer: <ConsumerDashboard />,
  };

  return (
    <div className="min-h-screen">
      {dashboards[role] || (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Unknown role. Please log in again.</p>
        </div>
      )}
    </div>
  );
}

import { Navigate } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import { useAuth } from '../../context/AuthContext';

const ProtectedLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-600">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <AppLayout />;
};

export default ProtectedLayout;

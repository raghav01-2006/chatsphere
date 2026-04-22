
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Higher-order component to protect routes that require Admin privileges.
 * Redirects to dashboard if not an admin.
 */
const AdminRoute = ({ children }) => {
  const { user, token } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  
  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;

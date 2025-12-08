import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return children;
};

export default RoleBasedRoute;
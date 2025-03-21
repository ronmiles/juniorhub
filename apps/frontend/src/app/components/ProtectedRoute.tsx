import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  const tryToSetUser = () => {
    const params = new URLSearchParams(location.search);

    const userId = params.get('userId');
    const email = params.get('email');
    const name = params.get('name');
    const role = params.get('role');
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken');
    
    if (!userId || !email || !name || !accessToken || !refreshToken) return;
        
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    const newUser = {
      id: userId,
      email: email,
      name: name,
      role: role as 'junior' | 'company',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return newUser;
  }

  const authUser = user ?? tryToSetUser();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if roles are specified
  if (roles && !roles.includes(authUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute; 
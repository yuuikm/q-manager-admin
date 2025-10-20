import { type FC, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import Layout from './Layout';
import { LINKS } from 'constants/routes';

interface RouteWrapperProps {
  children: ReactNode;
}

const RouteWrapper: FC<RouteWrapperProps> = ({ children }) => {
  const { isAuthenticated, user } = useAppSelector((state: any) => state.auth);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to={LINKS.loginLink} replace />;
  }

  // If authenticated, wrap with Layout
  return <Layout>{children}</Layout>;
};

export default RouteWrapper;

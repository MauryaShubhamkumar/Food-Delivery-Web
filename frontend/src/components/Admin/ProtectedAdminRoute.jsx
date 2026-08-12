import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import AccessDenied from './AccessDenied';
import './ProtectedAdminRoute.css';

const ProtectedAdminRoute = ({ children, requiredPermission }) => {
  const { token, user, userLoading, hasPermission } = useContext(StoreContext);

  if (userLoading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-spinner"></div>
        <p>Verifying Admin Authorization...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // Reject customer role from admin dashboard
  if (user.role === 'customer') {
    return <Navigate to="/" replace />;
  }

  // Check granular permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDenied requiredPermission={requiredPermission} />;
  }

  return children;
};

export default ProtectedAdminRoute;

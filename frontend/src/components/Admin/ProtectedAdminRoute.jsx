import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import './ProtectedAdminRoute.css';

const ProtectedAdminRoute = ({ children }) => {
  const { token, user, userLoading } = useContext(StoreContext);

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

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;

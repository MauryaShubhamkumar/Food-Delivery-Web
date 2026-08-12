import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import './AccessDenied.css';

const AccessDenied = ({ requiredPermission }) => {
  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-denied-icon">
          <ShieldAlert size={48} />
        </div>
        <span className="access-denied-code">403 FORBIDDEN</span>
        <h2>Access Denied</h2>
        <p>
          You don't have permission to access this administrative module.
          {requiredPermission ? ` (Requires: ${requiredPermission})` : ''}
        </p>
        <div className="access-denied-actions">
          <Link to="/admin" className="btn-primary">
            <LayoutDashboard size={16} /> Go to Dashboard
          </Link>
          <Link to="/" className="btn-secondary">
            <ArrowLeft size={16} /> Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;

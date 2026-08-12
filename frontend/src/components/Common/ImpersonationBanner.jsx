import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { ShieldAlert, LogOut } from 'lucide-react';
import './ImpersonationBanner.css';

const ImpersonationBanner = () => {
  const { isImpersonated, user, exitImpersonation } = useContext(StoreContext);
  const navigate = useNavigate();

  const hasOriginalToken = Boolean(localStorage.getItem("originalAdminToken"));

  if (!isImpersonated && !hasOriginalToken) {
    return null;
  }

  const handleExit = async () => {
    await exitImpersonation();
    navigate('/super-admin/restaurants');
  };

  return (
    <div className="impersonation-banner">
      <div className="impersonation-banner-inner">
        <div className="impersonation-info">
          <div className="impersonation-badge">
            <ShieldAlert size={16} /> Impersonation Mode Active
          </div>
          <span>
            Viewing dashboard as store owner: <strong className="impersonation-store-name">{user?.name || 'Restaurant Owner'}</strong> ({user?.email || 'Partner'})
          </span>
        </div>

        <button className="btn-exit-impersonation" onClick={handleExit}>
          <LogOut size={15} /> Exit Impersonation Mode
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;

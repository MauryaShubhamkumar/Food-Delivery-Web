import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, productName, deleting }) => {
  if (!isOpen) return null;

  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <div className="product-modal-container" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="product-modal-header">
          <h3 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={18} /> Delete Product?
          </h3>
          <button className="close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ margin: '12px 0', fontSize: '15px', color: '#334155', lineHeight: '1.5' }}>
          Are you sure you want to delete <strong>"{productName}"</strong>?
          <p style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
            Note: If this item is present in historical customer orders, it will be safely marked as <em>Unavailable</em> to protect order history integrity.
          </p>
        </div>

        <div className="product-modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-save"
            style={{ backgroundColor: '#dc2626' }}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

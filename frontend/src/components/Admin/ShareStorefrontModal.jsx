import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Download,
  Share2,
  MessageCircle,
  Camera,
  Printer,
  Sparkles,
  Store,
  ArrowRight
} from 'lucide-react';
import { getQRCodeImageUrl, downloadQRCodeImage } from '../../utils/qrGenerator';
import './ShareStorefrontModal.css';

const ShareStorefrontModal = ({ isOpen, onClose, restaurantName, slug }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedIg, setCopiedIg] = useState(false);
  const [activeTab, setActiveTab] = useState('share'); // 'share' | 'qr' | 'print'

  if (!isOpen) return null;

  const currentOrigin = window.location.origin;
  const storeUrl = `${currentOrigin}/r/${slug || 'restaurant'}`;
  const qrImageUrl = getQRCodeImageUrl(storeUrl, 400);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const whatsappMessage = `Order directly from ${restaurantName || 'our restaurant'} online! 🍔🍕\nExplore our full menu, customize your order & track delivery live:\n👉 ${storeUrl}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  const igBioSnippet = `🍔 Order Online from ${restaurantName || 'us'} 👇\n${storeUrl}`;
  const handleCopyIgBio = () => {
    navigator.clipboard.writeText(igBioSnippet);
    setCopiedIg(true);
    setTimeout(() => setCopiedIg(false), 2500);
  };

  const handleDownloadQr = () => {
    downloadQRCodeImage(storeUrl, `${slug || 'restaurant'}-fastbite-qr.png`);
  };

  const handlePrintFlyer = () => {
    window.print();
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-modal-header">
          <div className="share-header-title">
            <div className="share-icon-wrap">
              <Share2 size={20} />
            </div>
            <div>
              <h3>Share & Promote Your Storefront</h3>
              <p>Turn social followers & walk-in guests into digital orders.</p>
            </div>
          </div>
          <button className="share-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="share-tabs">
          <button
            className={`share-tab-btn ${activeTab === 'share' ? 'active' : ''}`}
            onClick={() => setActiveTab('share')}
          >
            <Share2 size={15} /> Social & Link
          </button>
          <button
            className={`share-tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
            onClick={() => setActiveTab('qr')}
          >
            <QrCode size={15} /> Store QR Code
          </button>
          <button
            className={`share-tab-btn ${activeTab === 'print' ? 'active' : ''}`}
            onClick={() => setActiveTab('print')}
          >
            <Printer size={15} /> Counter Flyer Template
          </button>
        </div>

        {/* Tab 1: Link & Social Share */}
        {activeTab === 'share' && (
          <div className="share-tab-content">
            {/* Value Prop Banner */}
            <div className="value-pitch-banner">
              <Sparkles size={18} className="pitch-sparkle" />
              <div>
                <strong>Stop taking manual WhatsApp orders over phone calls!</strong>
                <p>Share your FastBite link with customers to receive structured orders with automatic live status tracking.</p>
              </div>
            </div>

            {/* Direct Link Copy Box */}
            <div className="share-section-block">
              <label className="share-section-label">Your Unique Storefront Link</label>
              <div className="store-url-input-group">
                <input type="text" readOnly value={storeUrl} className="store-url-input" />
                <button
                  className={`btn-copy-link ${copiedLink ? 'copied' : ''}`}
                  onClick={handleCopyLink}
                >
                  {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-preview-link"
                  title="Open Storefront Live Preview"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            {/* Social Share Grid */}
            <div className="social-share-grid">
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="social-share-card whatsapp-card"
              >
                <div className="social-icon-bg wa-bg">
                  <MessageCircle size={22} />
                </div>
                <div className="social-card-text">
                  <strong>Share on WhatsApp</strong>
                  <p>Send pre-filled menu link to customers or status</p>
                </div>
                <ArrowRight size={16} className="arrow-icon" />
              </a>

              <div className="social-share-card instagram-card" onClick={handleCopyIgBio}>
                <div className="social-icon-bg ig-bg">
                  <Camera size={22} />
                </div>
                <div className="social-card-text">
                  <strong>{copiedIg ? 'Copied Bio Text!' : 'Copy for Instagram Bio'}</strong>
                  <p>Formatted bio snippet ready to paste on Instagram</p>
                </div>
                {copiedIg ? <Check size={16} color="#10b981" /> : <Copy size={16} className="arrow-icon" />}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: QR Code */}
        {activeTab === 'qr' && (
          <div className="share-tab-content qr-tab-layout">
            <div className="qr-preview-box">
              <div className="qr-image-wrapper">
                <img src={qrImageUrl} alt={`${restaurantName} QR Code`} className="qr-code-img" />
              </div>
              <div className="qr-store-info">
                <span className="qr-store-name">{restaurantName || 'FastBite Partner'}</span>
                <span className="qr-store-url">{storeUrl}</span>
              </div>
            </div>

            <div className="qr-actions-column">
              <div className="qr-info-text">
                <h4>Scan to View Menu & Order</h4>
                <p>Download this high-resolution QR code PNG and place it on:</p>
                <ul>
                  <li>✅ Dining Table Standees</li>
                  <li>✅ Restaurant Counter Display</li>
                  <li>✅ Printed Menu Cards & Takeaway Bags</li>
                  <li>✅ Google Business Photos</li>
                </ul>
              </div>

              <button className="btn-download-qr" onClick={handleDownloadQr}>
                <Download size={18} /> Download High-Res QR PNG
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Counter Flyer Template */}
        {activeTab === 'print' && (
          <div className="share-tab-content print-tab-layout">
            <div className="print-flyer-preview-card" id="printable-flyer">
              <div className="flyer-header">
                <Store size={28} className="flyer-logo-icon" />
                <h2>{restaurantName || 'FastBite Partner'}</h2>
                <span className="flyer-tagline">ORDER ONLINE & SKIP THE QUEUE</span>
              </div>

              <div className="flyer-qr-box">
                <img src={qrImageUrl} alt="Scan QR Code to Order" className="flyer-qr-img" />
                <p className="flyer-scan-text">Scan with phone camera to view menu & place order</p>
              </div>

              <div className="flyer-footer">
                <p className="flyer-link-text">{storeUrl}</p>
                <span className="flyer-powered">Powered by FastBite Express</span>
              </div>
            </div>

            <div className="print-actions-bar">
              <button className="btn-print-flyer" onClick={handlePrintFlyer}>
                <Printer size={18} /> Print Flyer / Save PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareStorefrontModal;

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { getQRCodeImageUrl } from '../../utils/qrGenerator';
import ShareStorefrontModal from './ShareStorefrontModal';
import './StorefrontShareCard.css';

const StorefrontShareCard = ({ restaurantName, slug }) => {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentOrigin = window.location.origin;
  const storeUrl = `${currentOrigin}/r/${slug || 'restaurant'}`;
  const qrUrl = getQRCodeImageUrl(storeUrl, 160);

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappMessage = `Order directly from ${restaurantName || 'our restaurant'} online! 🍔🍕\nExplore our full menu, customize your order & track delivery live:\n👉 ${storeUrl}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      <div className="storefront-share-promo-card">
        <div className="share-promo-header">
          <div className="share-promo-badge">
            <Sparkles size={14} /> LIVE STOREFRONT LINK
          </div>
          <h3>Share Your Digital Storefront</h3>
          <p>
            Stop taking manual phone orders! Give your customers this direct ordering link on Instagram, WhatsApp, and Google Business.
          </p>
        </div>

        <div className="share-promo-body">
          <div className="share-url-box">
            <input type="text" readOnly value={storeUrl} className="share-url-text" />
            <button
              className={`btn-copy-chip ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy Storefront URL"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="share-action-buttons">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-share-whatsapp"
            >
              <MessageCircle size={15} /> WhatsApp Share
            </a>
            <button className="btn-open-qr-modal" onClick={() => setIsModalOpen(true)}>
              <QrCode size={15} /> QR Code & Print Flyer
            </button>
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-view-live-store"
            >
              <ExternalLink size={15} /> Live Preview
            </a>
          </div>
        </div>

        {/* Small QR Thumbnail Badge */}
        <div className="share-promo-qr-preview" onClick={() => setIsModalOpen(true)}>
          <img src={qrUrl} alt="Store QR Preview" className="qr-thumb-img" />
          <span>Tap for QR & Marketing Kit</span>
        </div>
      </div>

      <ShareStorefrontModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurantName={restaurantName}
        slug={slug}
      />
    </>
  );
};

export default StorefrontShareCard;

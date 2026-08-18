/**
 * Utility to generate scannable high-resolution QR code image URL for storefront links
 */
export const getQRCodeImageUrl = (dataUrl, size = 400) => {
  if (!dataUrl) return '';
  const encoded = encodeURIComponent(dataUrl.trim());
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=10`;
};

export const downloadQRCodeImage = async (dataUrl, filename = 'storefront-qr-code.png') => {
  try {
    const qrUrl = getQRCodeImageUrl(dataUrl, 600);
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error('Failed to download QR code image:', err);
    window.open(getQRCodeImageUrl(dataUrl, 600), '_blank');
  }
};

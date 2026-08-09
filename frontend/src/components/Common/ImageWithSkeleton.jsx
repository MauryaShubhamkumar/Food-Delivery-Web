import React, { useState } from 'react';
import './ImageWithSkeleton.css';

const getOptimizedImgUrl = (src, width = 500) => {
  if (!src) return '/placeholder-food.png';
  if (src.includes('res.cloudinary.com') && !src.includes('/f_auto,q_auto')) {
    return src.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
  }
  return src;
};

const ImageWithSkeleton = ({
  src,
  alt = 'FastBite Food Item',
  className = '',
  width = 500,
  loading = 'lazy',
  onClick
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimizedSrc = getOptimizedImgUrl(src, width);

  return (
    <div className={`img-skeleton-container ${className}`} onClick={onClick}>
      {!loaded && !error && <div className="img-skeleton-shimmer" />}

      {error ? (
        <div className="img-fallback-placeholder">
          <span>🍽️ FastBite</span>
        </div>
      ) : (
        <img
          src={optimizedSrc}
          alt={alt}
          loading={loading}
          className={`optimized-img ${loaded ? 'img-loaded' : 'img-loading'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

export default ImageWithSkeleton;

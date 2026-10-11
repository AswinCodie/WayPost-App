import React, { useEffect, useState } from 'react';
import { imageStorage } from '../../lib/imageStorage';

interface IndexedDbImageProps {
  imageId: string;
  alt?: string;
  className?: string;
  fallbackText?: string;
}

export const IndexedDbImage: React.FC<IndexedDbImageProps> = ({
  imageId,
  alt = 'Waypost Note Image',
  className = '',
  fallbackText,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    // New shared notes store a compact data URL. Existing local notes still
    // use IndexedDB, so keep both formats working.
    if (imageId.startsWith('data:image/') || /^https?:\/\//.test(imageId)) {
      setImageUrl(imageId);
      setIsLoading(false);
      return () => { isMounted = false; };
    }

    imageStorage.getImageUrl(imageId)
      .then((url) => {
        if (isMounted) {
          if (url) {
            setImageUrl(url);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [imageId]);

  if (isLoading) {
    return (
      <div className={`bg-[#E8E3D5] animate-pulse flex items-center justify-center text-xs text-secondaryText ${className}`}>
        <span>Loading photo...</span>
      </div>
    );
  }

  if (hasError || !imageUrl) {
    return (
      <div className={`bg-[#E8E3D5] flex items-center justify-center text-xs text-secondaryText ${className}`}>
        <span>{fallbackText || 'Photo unavailable'}</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
};

import React from 'react';

interface StitchMarkProps {
  className?: string;
  src?: string;
  alt?: string;
}

const StitchMark: React.FC<StitchMarkProps> = ({
  className = 'stitch-logo-img',
  src = '/images/logos/stitch-logo-primary.webp',
  alt = 'Stitch',
}) => (
  <div className={`stitch-mark ${className}`}>
    <img src={src} alt={alt} className={className} />
  </div>
);

export default StitchMark;



import React from 'react';

interface AnimatedGifProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

const AnimatedGif: React.FC<AnimatedGifProps> = ({
  src,
  alt,
  className = '',
  width,
  height
}) => {
  return (
    <div className={`relative ${className}`}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded-lg shadow-lg"
        loading="lazy"
      />
    </div>
  );
};

export default AnimatedGif;
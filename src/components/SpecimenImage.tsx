import React, { useState } from 'react';
import { Leaf, Compass } from 'lucide-react';
import { SpecimenCategory } from '../types';

interface SpecimenImageProps {
  src: string;
  alt: string;
  category?: SpecimenCategory;
  className?: string;
}

export const SpecimenImage: React.FC<SpecimenImageProps> = ({
  src,
  alt,
  category = 'plant',
  className = 'w-full h-full object-cover',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EFECE6] text-[#0F291E] p-4 text-center select-none ${className}`}
      >
        {category === 'animal' ? (
          <Compass className="w-7 h-7 stroke-[1.5] text-[#0F291E]/60 mb-1.5" />
        ) : (
          <Leaf className="w-7 h-7 stroke-[1.5] text-[#0F291E]/60 mb-1.5" />
        )}
        <span className="font-serif italic text-xs text-[#141E19]/80 line-clamp-2 px-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};

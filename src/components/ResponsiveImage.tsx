import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  aspectRatio = "aspect-video",
  priority = false 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // In a real app, we would generate these URLs via a CDN like Cloudinary or Imgix
  // For this demo, we'll use the same source but simulate different sizes
  const srcSet = `
    ${src}?w=400 400w,
    ${src}?w=800 800w,
    ${src}?w=1200 1200w,
    ${src}?w=1600 1600w
  `;

  const sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/5 ${aspectRatio} ${className}`}>
      {/* Placeholder / Blur effect */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center"
          >
            <div className="w-8 h-8 border-2 border-c-violet/30 border-t-c-violet rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.img
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ 
          opacity: isLoaded ? 1 : 0,
          scale: isLoaded ? 1 : 1.1
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default ResponsiveImage;

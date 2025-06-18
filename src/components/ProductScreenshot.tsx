
import React from 'react';

type ProductScreenshotProps = {
  src: string;
  alt: string;
  caption: string;
};

const ProductScreenshot: React.FC<ProductScreenshotProps> = ({ src, alt, caption }) => {
  return (
    <div className="flex flex-col">
      <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
        <div className="bg-gray-800/50 py-1 px-2 flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div className="text-xs text-gray-400 truncate">{alt}</div>
        </div>
        <div className="relative">
          <img 
            src={src} 
            alt={alt} 
            className="w-full object-cover hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end">
            <div className="p-4 text-white text-sm">
              Click to enlarge
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-300 mt-3 italic px-2">{caption}</p>
    </div>
  );
};

export default ProductScreenshot;
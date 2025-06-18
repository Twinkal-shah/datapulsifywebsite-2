
import React from 'react';

type ProgressBarProps = {
  total: number;
  claimed: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ total, claimed }) => {
  // Calculate percentage claimed
  const percentage = Math.round((claimed / total) * 100);
  
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white font-medium">{claimed} claimed</span>
        <span className="text-gray-400">{total} total spots</span>
      </div>
      
      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ClickGapContentProps {
  isActive: boolean;
  onNavigate?: (section: string) => void;
}

export function ClickGapContent({ isActive, onNavigate }: ClickGapContentProps) {
  const navigate = useNavigate();

  // Temporarily redirect to the original page until we can properly extract the content
  useEffect(() => {
    if (isActive) {
      navigate('/click-gap-intelligence-original', { replace: true });
    }
  }, [isActive, navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading Click Gap Intelligence...</p>
      </div>
    </div>
  );
}

export default ClickGapContent; 
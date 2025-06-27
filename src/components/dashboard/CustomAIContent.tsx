import React from 'react';

// Import the existing content from CustomAIDashboard page
import CustomAIDashboardPageContent from '@/pages/CustomAIDashboard';

interface CustomAIContentProps {
  isActive: boolean;
  onNavigate?: (section: string) => void;
}

export function CustomAIContent({ isActive, onNavigate }: CustomAIContentProps) {
  return (
    <div className="w-full">
      <CustomAIDashboardPageContent />
    </div>
  );
}

export default CustomAIContent; 
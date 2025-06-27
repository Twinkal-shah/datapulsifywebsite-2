import React from 'react';

// Import the existing content from Settings page
import SettingsPageContent from '@/pages/Settings';

interface SettingsContentProps {
  isActive: boolean;
  onNavigate?: (section: string) => void;
}

export function SettingsContent({ isActive, onNavigate }: SettingsContentProps) {
  return (
    <div className="w-full">
      <SettingsPageContent />
    </div>
  );
}

export default SettingsContent; 
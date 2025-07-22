import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  KeyRound, 
  Network, 
  FileBarChart2, 
  FileDown, 
  Settings,
  X,
  Target,
  Bug
} from 'lucide-react';
import { Button } from './ui/button';
import { testSubdomainConfiguration } from '@/utils/subdomainTest';
import { testAuth, clearAllAuth } from '@/utils/authTest';

/**
 * Development Navigation Panel - only shown in development mode
 * Provides quick access to all dashboard pages for testing
 */
export const DevNavPanel = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null;
  }
  
  const routes = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { path: '/click-gap-intelligence', label: 'Click Gap Intelligence', icon: <Target size={16} /> },
    { path: '/rank-tracker', label: 'Rank Tracker', icon: <TrendingUp size={16} /> },
    { path: '/keyword-analysis', label: 'Keyword Analysis', icon: <KeyRound size={16} /> },
    { path: '/gap-analysis', label: 'Gap Analysis', icon: <Network size={16} /> },
    { path: '/keyword-clustering', label: 'Keyword Clustering', icon: <FileBarChart2 size={16} /> },
    { path: '/reports', label: 'Reports', icon: <FileDown size={16} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={16} /> },
  ];
  
  const navigateTo = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };
  
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-blue-600 hover:bg-blue-700"
      >
        Dev Tools
      </Button>
    );
  }
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-gray-800 shadow-lg rounded-lg p-4 border border-gray-700 w-64">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-bold">Dev Navigation</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0 text-gray-400 hover:bg-gray-700 hover:text-white">
          <X size={16} />
        </Button>
      </div>
      
      <div className="space-y-2">
        {routes.map((route) => (
          <Button
            key={route.path}
            variant="ghost"
            className="w-full justify-start text-sm text-gray-300 hover:bg-gray-700 hover:text-blue-300"
            onClick={() => navigateTo(route.path)}
          >
            <span className="mr-2 text-blue-400">{route.icon}</span>
            {route.label}
          </Button>
        ))}
      </div>
      
      <div className="mt-3 border-t border-gray-700 pt-2 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-gray-300 hover:bg-gray-700 hover:text-yellow-300"
          onClick={() => testSubdomainConfiguration()}
        >
          <Bug className="mr-2" size={12} />
          Test Subdomain Config
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-gray-300 hover:bg-gray-700 hover:text-blue-300"
          onClick={() => testAuth()}
        >
          <Bug className="mr-2" size={12} />
          Test Auth Status
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-gray-300 hover:bg-gray-700 hover:text-red-300"
          onClick={() => clearAllAuth()}
        >
          <X className="mr-2" size={12} />
          Clear All Auth
        </Button>
        
        <div className="text-xs text-gray-400 mt-2">
          Dev mode: Testing tools
        </div>
      </div>
    </div>
  );
}; 
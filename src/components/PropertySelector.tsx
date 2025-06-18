import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Check,
  Globe,
  Settings,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface GSCProperty {
  siteUrl: string;
}

// Create a custom event for property changes
const PROPERTY_CHANGE_EVENT = 'gsc-property-changed';

export function PropertySelector() {
  const { getGSCToken } = useAuth();
  const navigate = useNavigate();
  const [gscProperties, setGscProperties] = useState<GSCProperty[]>([]);
  const [currentProperty, setCurrentProperty] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const googleAuthService = new GoogleAuthService();

  // Load current property and fetch available properties
  useEffect(() => {
    const loadPropertyData = async () => {
      try {
        setIsLoading(true);
        
        // Get current property from localStorage
        const savedProperty = localStorage.getItem('gsc_property');
        if (savedProperty) {
          setCurrentProperty(savedProperty);
        }

        // Check if user is connected to GSC
        const token = getGSCToken();
        if (!token) {
          setGscProperties([]);
          setIsLoading(false);
          return;
        }

        // Fetch available GSC properties
        const properties = await googleAuthService.fetchGSCProperties();
        setGscProperties(properties);
        
        // If no current property is set but we have properties, set the first one
        if (!savedProperty && properties.length > 0) {
          const firstProperty = properties[0].siteUrl;
          setCurrentProperty(firstProperty);
          localStorage.setItem('gsc_property', firstProperty);
          
          // Dispatch property change event
          window.dispatchEvent(new CustomEvent(PROPERTY_CHANGE_EVENT, {
            detail: { property: firstProperty, isInitial: true }
          }));
        }
        
      } catch (error) {
        console.error('Error loading GSC properties:', error);
        setGscProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPropertyData();
  }, [getGSCToken]);

  const handlePropertySelect = async (propertyUrl: string) => {
    if (propertyUrl === currentProperty || isSwitching) return;
    
    try {
      setIsSwitching(true);
      
      // Update localStorage
      localStorage.setItem('gsc_property', propertyUrl);
      setCurrentProperty(propertyUrl);

      // Show success message
      toast({
        title: 'Property Updated',
        description: `Now using ${formatPropertyUrl(propertyUrl)} for data analysis`,
        variant: 'default'
      });

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent(PROPERTY_CHANGE_EVENT, {
        detail: { property: propertyUrl, isInitial: false }
      }));

      // Small delay to ensure the event is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('Error switching property:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch property. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleRefreshProperties = async () => {
    try {
      setIsRefreshing(true);
      const token = getGSCToken();
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please connect to Google Search Console first',
          variant: 'destructive'
        });
        return;
      }

      const properties = await googleAuthService.fetchGSCProperties();
      setGscProperties(properties);
      
      toast({
        title: 'Success',
        description: 'Properties refreshed successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error refreshing properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh properties. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatPropertyUrl = (url: string) => {
    // Remove protocol and trailing slash for display
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };

  const handleGoToSettings = () => {
    navigate('/settings/googlesearchconsole');
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading properties...</span>
        </div>
      </div>
    );
  }

  // If not connected to GSC
  if (!getGSCToken()) {
    return (
      <div className="px-4 py-2">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">GSC Property</div>
        <Button
          variant="ghost"
          onClick={handleGoToSettings}
          className="w-full justify-start text-left p-3 h-auto bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/50"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-300">
                Connect to GSC
              </div>
              <div className="text-xs text-gray-500">
                Click to connect your account
              </div>
            </div>
          </div>
        </Button>
      </div>
    );
  }

  // If no properties available
  if (gscProperties.length === 0) {
    return (
      <div className="px-4 py-2">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">GSC Property</div>
        <div className="flex items-center gap-2 text-gray-400 p-3 bg-gray-700/30 rounded border border-gray-600/50">
          <Globe className="h-4 w-4" />
          <span className="text-sm">No properties found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">GSC Property</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            disabled={isSwitching}
            className="w-full justify-between text-left p-3 h-auto bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/50 disabled:opacity-70"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {isSwitching ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-400 flex-shrink-0" />
              ) : (
                <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {currentProperty ? formatPropertyUrl(currentProperty) : 'Select Property'}
                </div>
                <div className="text-xs text-gray-400">
                  {isSwitching ? 'Switching property...' : `${gscProperties.length} ${gscProperties.length === 1 ? 'property' : 'properties'} available`}
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent
          align="start"
          className="w-64 bg-gray-800 border-gray-700"
        >
          {gscProperties.map((property) => (
            <DropdownMenuItem
              key={property.siteUrl}
              onClick={() => handlePropertySelect(property.siteUrl)}
              disabled={isSwitching}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer",
                property.siteUrl === currentProperty
                  ? "bg-blue-900/30 text-blue-400"
                  : "text-gray-300 hover:bg-gray-700 focus:bg-gray-700",
                isSwitching && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {property.siteUrl === currentProperty && (
                  <Check className="h-3 w-3 text-blue-400 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {formatPropertyUrl(property.siteUrl)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {property.siteUrl}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator className="bg-gray-700" />
          
          <DropdownMenuItem
            onClick={handleRefreshProperties}
            disabled={isRefreshing || isSwitching}
            className="flex items-center gap-3 p-3 text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Properties'}</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={handleGoToSettings}
            disabled={isSwitching}
            className="flex items-center gap-3 p-3 text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
          >
            <Settings className="h-4 w-4" />
            <span>GSC Settings</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Export the event name for use in other components
export { PROPERTY_CHANGE_EVENT }; 
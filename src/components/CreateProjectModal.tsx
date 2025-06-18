import React, { useState, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, ExternalLink, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleAuthService } from '@/lib/googleAuthService';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const {
    createProject,
    isCreatingProject,
    gscProperties,
    isLoadingProperties,
    fetchGSCProperties,
  } = useProject();

  const [projectName, setProjectName] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [errors, setErrors] = useState<{ name?: string; property?: string }>({});
  const [isConnectedToGSC, setIsConnectedToGSC] = useState(false);

  // Check GSC connection status
  useEffect(() => {
    const checkGSCConnection = () => {
      const token = localStorage.getItem('gsc_token');
      setIsConnectedToGSC(!!token);
    };

    checkGSCConnection();
    
    // Check connection status when modal opens
    if (open) {
      checkGSCConnection();
    }
  }, [open]);

  // Fetch GSC properties when modal opens
  useEffect(() => {
    if (open && isConnectedToGSC && gscProperties.length === 0) {
      fetchGSCProperties();
    }
  }, [open, isConnectedToGSC, gscProperties.length, fetchGSCProperties]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setProjectName('');
      setSelectedProperty('');
      setErrors({});
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: { name?: string; property?: string } = {};

    if (!projectName.trim()) {
      newErrors.name = 'Project name is required';
    } else if (projectName.trim().length < 2) {
      newErrors.name = 'Project name must be at least 2 characters';
    } else if (projectName.trim().length > 50) {
      newErrors.name = 'Project name must be less than 50 characters';
    }

    if (!selectedProperty) {
      newErrors.property = 'Please select a GSC website property';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createProject(projectName.trim(), selectedProperty);
      onOpenChange(false);
    } catch (error) {
      // Error is already handled in the context with toast
      console.error('Failed to create project:', error);
    }
  };

  const handleConnectToGSC = async () => {
    try {
      const googleAuth = new GoogleAuthService();
      await googleAuth.initiateGSCAuth();
    } catch (error) {
      console.error('Error connecting to GSC:', error);
    }
  };

  const handleGoToSettings = () => {
    onOpenChange(false);
    navigate('/settings/googlesearchconsole');
  };

  const formatPropertyUrl = (url: string) => {
    // Remove protocol and trailing slash for display
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Project</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new SEO project connected to a Google Search Console property.
          </DialogDescription>
        </DialogHeader>

        {!isConnectedToGSC ? (
          // Show GSC connection prompt if not connected
          <div className="space-y-4">
            <Alert className="bg-blue-900/20 border-blue-700">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                You need to connect to Google Search Console first to create projects.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleConnectToGSC}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect to Google Search Console
              </Button>
              
              <Button
                variant="outline"
                onClick={handleGoToSettings}
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                <Settings className="mr-2 h-4 w-4" />
                Go to Settings
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Show project creation form if connected
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-gray-200">
                Project Name
              </Label>
              <Input
                id="project-name"
                type="text"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                disabled={isCreatingProject}
              />
              {errors.name && (
                <p className="text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gsc-property" className="text-gray-200">
                Google Search Console Property
              </Label>
              {isLoadingProperties ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  <span className="ml-2 text-gray-400">Loading properties...</span>
                </div>
              ) : gscProperties.length === 0 ? (
                <Alert className="bg-yellow-900/20 border-yellow-700">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-200">
                    No GSC properties found. Please ensure you have verified properties in your Google Search Console account.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedProperty}
                  onValueChange={setSelectedProperty}
                  disabled={isCreatingProject}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-blue-500">
                    <SelectValue placeholder="Select a website property" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {gscProperties.map((property) => (
                      <SelectItem
                        key={property.siteUrl}
                        value={property.siteUrl}
                        className="text-white hover:bg-gray-600 focus:bg-gray-600"
                      >
                        {formatPropertyUrl(property.siteUrl)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.property && (
                <p className="text-sm text-red-400">{errors.property}</p>
              )}
            </div>

            <DialogFooter className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCreatingProject}
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingProject || gscProperties.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreatingProject ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 
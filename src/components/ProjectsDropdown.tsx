import React, { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Check,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProjectsDropdown() {
  const {
    projects,
    currentProject,
    isLoading,
    isSyncing,
    switchProject,
    deleteProject,
    syncProjectData,
  } = useProject();

  const [isOpen, setIsOpen] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleDeleteProject = (projectId: string, projectName: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const getSyncStatusIcon = (status: string, projectId: string) => {
    if (isSyncing && currentProject?.id === projectId) {
      return <Loader2 className="h-3 w-3 animate-spin text-blue-400" />;
    }

    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'syncing':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-400" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      case 'pending':
        return <RefreshCw className="h-3 w-3 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getSyncStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Sync failed';
      case 'pending':
        return 'Pending sync';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading projects...</span>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return null; // Don't show the dropdown if there are no projects
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="px-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between text-gray-300 hover:bg-gray-700 hover:text-gray-100 p-2"
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="font-medium">Projects</span>
              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                {projects.length}
              </span>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-1 mt-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                "group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                project.id === currentProject?.id
                  ? "bg-blue-900/30 text-blue-400"
                  : "text-gray-300 hover:bg-gray-700 hover:text-gray-100"
              )}
            >
              <button
                onClick={() => switchProject(project.id)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {project.id === currentProject?.id && (
                    <Check className="h-3 w-3 text-blue-400 flex-shrink-0" />
                  )}
                  <span className="truncate font-medium">{project.name}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {getSyncStatusIcon(project.sync_status, project.id)}
                </div>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-gray-800 border-gray-700"
                >
                  <DropdownMenuItem
                    onClick={() => syncProjectData(project.id)}
                    disabled={isSyncing}
                    className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    className="text-red-400 hover:bg-red-900/20 focus:bg-red-900/20"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {/* Sync status legend */}
          <div className="mt-3 pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>Synced</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 text-blue-400" />
                <span>Syncing</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3 text-red-400" />
                <span>Sync failed</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3 text-yellow-400" />
                <span>Pending</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this project? This action cannot be undone.
              All associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-300 border-gray-600 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 
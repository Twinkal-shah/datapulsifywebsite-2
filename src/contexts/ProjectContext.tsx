import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';
import { GoogleAuthService } from '@/lib/googleAuthService';
import { GSCService } from '@/lib/gscService';
import { toast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  gsc_property: string;
  is_active: boolean;
  sync_status: 'pending' | 'syncing' | 'completed' | 'error';
  last_sync_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GSCProperty {
  siteUrl: string;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  isCreatingProject: boolean;
  isSyncing: boolean;
  gscProperties: GSCProperty[];
  isLoadingProperties: boolean;
  
  // Actions
  createProject: (name: string, gscProperty: string) => Promise<void>;
  switchProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  syncProjectData: (projectId: string) => Promise<void>;
  fetchGSCProperties: () => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [gscProperties, setGscProperties] = useState<GSCProperty[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  const googleAuthService = new GoogleAuthService();
  const gscService = new GSCService();

  // Load projects when user changes
  useEffect(() => {
    if (user) {
      initializeProjectsTable().then(() => {
        loadProjects();
      });
    } else {
      setProjects([]);
      setCurrentProject(null);
      setIsLoading(false);
    }
  }, [user]);

  const initializeProjectsTable = async () => {
    try {
      console.log('Checking if projects table exists...');
      
      // Try to query the projects table to see if it exists
      const { data, error } = await supabase
        .from('projects')
        .select('count(*)')
        .limit(1);

      if (error && error.code === '42P01') {
        // Table doesn't exist, show instructions to create it manually
        console.log('Projects table does not exist. Please create it manually in Supabase.');
        
        toast({
          title: "Database Setup Required",
          description: "Please run the SQL script in your Supabase dashboard to create the projects table. Check the console for details.",
          variant: "destructive",
        });
        
        console.log('='.repeat(80));
        console.log('PROJECTS TABLE SETUP REQUIRED');
        console.log('='.repeat(80));
        console.log('Please go to your Supabase dashboard > SQL Editor and run the SQL from create-projects-table.sql');
        console.log('Or copy and paste this SQL:');
        console.log(`
-- Create projects table for Multi-Project Workspace
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gsc_property TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'error')),
    last_sync_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name),
    UNIQUE(user_id, gsc_property)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_user_id_active_idx ON projects(user_id, is_active);
        `);
        console.log('='.repeat(80));
        
      } else if (error) {
        console.error('Error checking projects table:', error);
      } else {
        console.log('Projects table already exists');
      }
    } catch (error) {
      console.error('Error initializing projects table:', error);
    }
  };

  const loadProjects = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
      
      // Set current project to the active one or the first one
      const activeProject = data?.find(p => p.is_active) || data?.[0];
      if (activeProject) {
        setCurrentProject(activeProject);
        // Store current project in localStorage for persistence
        localStorage.setItem('current_project_id', activeProject.id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGSCProperties = async () => {
    try {
      setIsLoadingProperties(true);
      
      // Check if user is connected to GSC first
      const token = localStorage.getItem('gsc_token');
      if (!token) {
        setGscProperties([]);
        return;
      }

      const properties = await googleAuthService.fetchGSCProperties();
      setGscProperties(properties);
    } catch (error: any) {
      console.error('Error fetching GSC properties:', error);
      
      // Clear properties on error
      setGscProperties([]);
      
      // Check if it's an authentication error
      if (error.message?.includes('No valid token') || error.message?.includes('401')) {
        toast({
          title: "Authentication Required",
          description: "Please connect to Google Search Console in Settings to create projects.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch Google Search Console properties. Please check your connection.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const createProject = async (name: string, gscProperty: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsCreatingProject(true);
      console.log('Creating project:', { name, gscProperty, userId: user.id });

      // Test database connection and user authentication
      console.log('Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('projects')
        .select('count(*)')
        .eq('user_id', user.id);
      
      console.log('Database test result:', { testData, testError });

      // Check if project with same name or GSC property already exists
      console.log('Checking for existing projects...');
      const { data: existingProjects, error: checkError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .or(`name.eq.${name},gsc_property.eq.${gscProperty}`);

      if (checkError) {
        console.error('Error checking existing projects:', checkError);
        throw checkError;
      }

      console.log('Existing projects check result:', existingProjects);

      if (existingProjects && existingProjects.length > 0) {
        const duplicateName = existingProjects.find(p => p.name === name);
        const duplicateProperty = existingProjects.find(p => p.gsc_property === gscProperty);
        
        if (duplicateName) {
          throw new Error('A project with this name already exists');
        }
        if (duplicateProperty) {
          throw new Error('A project with this GSC property already exists');
        }
      }

      // Create the project
      console.log('Creating new project in database...');
      const projectData = {
        user_id: user.id,
        name,
        gsc_property: gscProperty,
        is_active: projects.length === 0, // Make first project active
        sync_status: 'pending' as const
      };
      console.log('Project data to insert:', projectData);

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Project created successfully:', data);

      const newProject = data as Project;
      setProjects(prev => [newProject, ...prev]);

      // If this is the first project or no current project, make it current
      if (!currentProject || projects.length === 0) {
        setCurrentProject(newProject);
        localStorage.setItem('current_project_id', newProject.id);
      }

      toast({
        title: "Success",
        description: `Project "${name}" created successfully`,
      });

      // Start syncing data for the new project
      console.log('Starting data sync for new project...');
      await syncProjectData(newProject.id);

    } catch (error: any) {
      console.error('Error creating project:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCreatingProject(false);
    }
  };

  const switchProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    try {
      // Update active status in database
      await supabase
        .from('projects')
        .update({ is_active: false })
        .eq('user_id', user?.id);

      await supabase
        .from('projects')
        .update({ is_active: true })
        .eq('id', projectId);

      // Update local state
      setProjects(prev => prev.map(p => ({
        ...p,
        is_active: p.id === projectId
      })));

      setCurrentProject(project);
      localStorage.setItem('current_project_id', projectId);

      toast({
        title: "Project Switched",
        description: `Switched to "${project.name}"`,
      });

    } catch (error) {
      console.error('Error switching project:', error);
      toast({
        title: "Error",
        description: "Failed to switch project",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));

      // If deleted project was current, switch to another one
      if (currentProject?.id === projectId) {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        if (remainingProjects.length > 0) {
          await switchProject(remainingProjects[0].id);
        } else {
          setCurrentProject(null);
          localStorage.removeItem('current_project_id');
        }
      }

      toast({
        title: "Success",
        description: `Project "${project.name}" deleted successfully`,
      });

    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const syncProjectData = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    try {
      setIsSyncing(true);

      // Update sync status to syncing
      await supabase
        .from('projects')
        .update({ sync_status: 'syncing' })
        .eq('id', projectId);

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, sync_status: 'syncing' as const } : p
      ));

      // Calculate date range (last 12 months)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Sync GSC data
      await gscService.syncGSCData(startDateStr, endDateStr);

      // Update sync status to completed
      await supabase
        .from('projects')
        .update({ 
          sync_status: 'completed',
          last_sync_date: new Date().toISOString()
        })
        .eq('id', projectId);

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { 
          ...p, 
          sync_status: 'completed' as const,
          last_sync_date: new Date().toISOString()
        } : p
      ));

      toast({
        title: "Sync Complete",
        description: `Data synced successfully for "${project.name}"`,
      });

    } catch (error) {
      console.error('Error syncing project data:', error);
      
      // Update sync status to error
      await supabase
        .from('projects')
        .update({ sync_status: 'error' })
        .eq('id', projectId);

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, sync_status: 'error' as const } : p
      ));

      toast({
        title: "Sync Failed",
        description: `Failed to sync data for "${project.name}"`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshProjects = async () => {
    await loadProjects();
  };

  const value: ProjectContextType = {
    projects,
    currentProject,
    isLoading,
    isCreatingProject,
    isSyncing,
    gscProperties,
    isLoadingProperties,
    createProject,
    switchProject,
    deleteProject,
    syncProjectData,
    fetchGSCProperties,
    refreshProjects,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
} 
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Project } from '@/types';

interface ProjectContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('active_project');
    if (stored) {
      try {
        setActiveProjectState(JSON.parse(stored));
      } catch {
        localStorage.removeItem('active_project');
      }
    }
  }, []);

  const setActiveProject = (project: Project | null) => {
    if (project) {
      localStorage.setItem('active_project', JSON.stringify(project));
    } else {
      localStorage.removeItem('active_project');
    }
    setActiveProjectState(project);
  };

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

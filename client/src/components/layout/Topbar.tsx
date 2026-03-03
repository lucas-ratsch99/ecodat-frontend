import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, LogOut, User, FolderOpen } from 'lucide-react';
import { useLocation } from 'wouter';
import { api } from '@/api/client';
import type { Project } from '@/types';

export function Topbar() {
  const { user, logout } = useAuth();
  const { activeProject, setActiveProject } = useProject();
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    api.projects.list().then(setProjects).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setActiveProject(project);
    }
  };

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <Select
            value={activeProject?.id || ''}
            onValueChange={handleProjectChange}
          >
            <SelectTrigger 
              className="w-[280px] border-none bg-muted/50 font-medium"
              data-testid="select-project"
            >
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem 
                  key={project.id} 
                  value={project.id}
                  data-testid={`project-option-${project.id}`}
                >
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="gap-2"
                data-testid="button-user-menu"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-item-profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                data-testid="menu-item-logout"
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

import { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { api } from '@/api/client';
import { formatDateTime } from '@/utils/safeName';
import { useToast } from '@/hooks/use-toast';
import { Plus, FolderKanban, Calendar, Check, Pencil, Loader2 } from 'lucide-react';
import type { Project } from '@/types';

export default function Projects() {
  const { activeProject, setActiveProject } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await api.projects.list();
      setProjects(data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load projects', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Project name is required', variant: 'destructive' });
      return;
    }
    try {
      const newProject = await api.projects.create(name.trim());
      setProjects([newProject, ...projects]);
      setIsCreateOpen(false);
      setName('');
      toast({ title: 'Success', description: 'Project created successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to create project', variant: 'destructive' });
    }
  };

  const handleEdit = async () => {
    if (!editingProject || !name.trim()) return;
    try {
      const updated = await api.projects.update(editingProject.id, name.trim());
      setProjects(prev => prev.map(p => p.id === editingProject.id ? updated : p));
      if (activeProject?.id === editingProject.id) {
        setActiveProject(updated);
      }
      setEditingProject(null);
      setName('');
      toast({ title: 'Success', description: 'Project updated successfully' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update project', variant: 'destructive' });
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your ecology data projects</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-project">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Add a new ecology data project to the platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., VM03 - Utrecht / Noord"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-project-name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} data-testid="button-submit-project">Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No projects yet. Create your first project to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className={`relative ${activeProject?.id === project.id ? 'ring-2 ring-primary' : ''}`}
              data-testid={`card-project-${project.id}`}
            >
              {activeProject?.id === project.id && (
                <Badge className="absolute right-3 top-3 gap-1" variant="default">
                  <Check className="h-3 w-3" />
                  Active
                </Badge>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">{project.name}</CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      Created {formatDateTime(project.created_at)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDateTime(project.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={activeProject?.id === project.id ? 'secondary' : 'default'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setActiveProject(project)}
                    data-testid={`button-select-project-${project.id}`}
                  >
                    {activeProject?.id === project.id ? 'Selected' : 'Select'}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(project)}
                    data-testid={`button-edit-project-${project.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-edit-project-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>Cancel</Button>
            <Button onClick={handleEdit} data-testid="button-save-project">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

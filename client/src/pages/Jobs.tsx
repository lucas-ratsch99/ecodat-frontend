import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/api/client';
import { formatDateTime, formatDuration } from '@/utils/safeName';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, RotateCcw, XCircle, CheckCircle2, AlertCircle, Clock, Loader2, Ban, Map, ShieldCheck } from 'lucide-react';
import type { Job, JobStatus } from '@/types';

const statusConfig: Record<JobStatus, { icon: typeof CheckCircle2; className: string; label: string }> = {
  PENDING: { icon: Clock, className: 'bg-muted text-muted-foreground', label: 'Pending' },
  RUNNING: { icon: Loader2, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Running' },
  SUCCEEDED: { icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Succeeded' },
  FAILED: { icon: AlertCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Failed' },
};

function StatusBadge({ status }: { status: JobStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`gap-1.5 border-0 ${config.className}`}>
      <Icon className={`h-3 w-3 ${status === 'RUNNING' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}

function getDuration(job: Job): number | null {
  if (job.started_at && job.completed_at) {
    return Math.floor((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000);
  }
  return null;
}

export default function Jobs() {
  const { activeProject } = useProject();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'ALL'>('ALL');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
  }, [activeProject]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const data = await api.jobs.list(activeProject?.id);
      setJobs(data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load jobs', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRerun = async (jobId: string) => {
    try {
      const updated = await api.jobs.rerun(jobId);
      setJobs(prev => prev.map(j => j.id === jobId ? updated : j));
      toast({ title: 'Job Restarted', description: `Job ${jobId} has been restarted` });
    } catch {
      toast({ title: 'Error', description: 'Failed to rerun job', variant: 'destructive' });
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filterStatus !== 'ALL' && job.status !== filterStatus) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        job.id.toLowerCase().includes(searchLower) ||
        (job.project_name || '').toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleViewResults = (job: Job) => {
    if (job.status === 'SUCCEEDED') {
      setLocation(`/results/${job.id}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <p className="text-sm text-muted-foreground">
          {activeProject 
            ? `Pipeline jobs for ${activeProject.name}` 
            : 'All pipeline jobs across projects'}
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <div>
            <CardTitle className="text-base">Job History</CardTitle>
            <CardDescription>{filteredJobs.length} jobs found</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                className="w-[200px] pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-jobs"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-filter-status">
                  {filterStatus === 'ALL' ? 'All Status' : filterStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus('ALL')}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('SUCCEEDED')}>Succeeded</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('RUNNING')}>Running</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('FAILED')}>Failed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('PENDING')}>Pending</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">Job ID</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[160px]">Started</TableHead>
                  <TableHead className="w-[100px]">Duration</TableHead>
                  <TableHead className="w-[200px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No jobs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => {
                    const duration = getDuration(job);
                    return (
                      <TableRow 
                        key={job.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewResults(job)}
                        data-testid={`row-job-${job.id}`}
                      >
                        <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-medium">{job.project_name || '-'}</TableCell>
                        <TableCell>
                          <StatusBadge status={job.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.started_at ? formatDateTime(job.started_at) : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {duration ? formatDuration(duration) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {job.status === 'SUCCEEDED' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setLocation(`/results/${job.id}`)}
                                  data-testid={`button-results-${job.id}`}
                                  className="h-8 px-2"
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  Results
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setLocation(`/qc/${job.id}`)}
                                  data-testid={`button-qc-${job.id}`}
                                  className="h-8 px-2"
                                >
                                  <ShieldCheck className="mr-1 h-4 w-4" />
                                  QC
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setLocation(`/gis/${job.id}`)}
                                  data-testid={`button-gis-${job.id}`}
                                  className="h-8 px-2"
                                >
                                  <Map className="mr-1 h-4 w-4" />
                                  GIS
                                </Button>
                              </>
                            )}
                            {job.status === 'FAILED' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2"
                                onClick={() => handleRerun(job.id)}
                              >
                                <RotateCcw className="mr-1 h-4 w-4" />
                                Rerun
                              </Button>
                            )}
                            {job.status === 'RUNNING' && (
                              <span className="text-xs text-muted-foreground">Processing...</span>
                            )}
                            {job.status === 'PENDING' && (
                              <span className="text-xs text-muted-foreground">Waiting...</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

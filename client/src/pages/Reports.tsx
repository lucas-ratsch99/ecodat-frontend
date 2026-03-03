import { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/api/client';
import { formatDateTime } from '@/utils/safeName';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Plus, 
  Clock, 
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { Job, Artifact } from '@/types';

export default function Reports() {
  const { activeProject } = useProject();
  const { toast } = useToast();
  const [reports, setReports] = useState<Artifact[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeProject]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [reportsData, jobsData] = await Promise.all([
        api.reports.list().catch(() => []),
        activeProject ? api.jobs.list(activeProject.id).catch(() => []) : Promise.resolve([]),
      ]);
      setReports(reportsData);
      setJobs(jobsData.filter(j => j.status === 'SUCCEEDED'));
    } catch {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!activeProject || !selectedJob) {
      toast({
        title: 'Missing Selection',
        description: 'Please select a job',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.reports.generate(selectedJob);
      toast({
        title: 'Report Generated',
        description: `Report created at: ${result.blob_path}`,
      });
      await loadData();
      setSelectedJob('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid h-full gap-6 p-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and manage project reports</p>
        </div>

        {!activeProject && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Please select a project to generate reports.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate Report</CardTitle>
            <CardDescription>Select a completed job to generate a DOCX report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Source Job</Label>
              <Select 
                value={selectedJob} 
                onValueChange={setSelectedJob}
                disabled={!activeProject || jobs.length === 0}
              >
                <SelectTrigger data-testid="select-job">
                  <SelectValue placeholder={jobs.length === 0 ? 'No completed jobs' : 'Select a job'} />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{job.id.slice(0, 8)}</span>
                        <span className="text-xs text-muted-foreground">
                          {job.started_at ? formatDateTime(job.started_at) : 'N/A'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              disabled={!activeProject || !selectedJob || isGenerating}
              onClick={handleGenerate}
              data-testid="button-generate-report"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Report History
            </CardTitle>
            <CardDescription>
              {reports.length} reports generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No reports generated yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-md border bg-card p-4"
                    data-testid={`report-${report.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium font-mono text-sm">{report.blob_path}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Format: {report.format} • {formatDateTime(report.created_at)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs uppercase">
                        {report.format}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

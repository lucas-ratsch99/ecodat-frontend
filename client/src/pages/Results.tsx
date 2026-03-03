import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/api/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Download, 
  Map, 
  AlertTriangle,
  Loader2,
  FileText,
  Database,
} from 'lucide-react';
import type { Job } from '@/types';

export default function Results() {
  const params = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const jobId = params.jobId;

  const [job, setJob] = useState<Job | null>(null);
  const [results, setResults] = useState<Record<string, string | null>>({});
  const [gisOutputs, setGisOutputs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [jobData, resultsData, gisData] = await Promise.all([
        api.jobs.get(jobId!),
        api.jobs.getResults(jobId!).catch(() => ({})),
        api.jobs.getGISOutputs(jobId!).catch(() => []),
      ]);
      setJob(jobData);
      setResults(resultsData);
      setGisOutputs(gisData);
    } catch {
      toast({ title: 'Error', description: 'Failed to load results', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <CardContent className="p-6">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-semibold">Job Not Found</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              The job you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => setLocation('/jobs')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const outputEntries = Object.entries(results).filter(([, v]) => v !== null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/jobs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Results</h1>
            <p className="text-sm text-muted-foreground">
              {job.project_name || 'Unknown Project'} • Job {job.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation(`/qc/${jobId}`)}>
            QC Flags
          </Button>
          <Button variant="outline" onClick={() => setLocation(`/gis/${jobId}`)}>
            <Map className="mr-2 h-4 w-4" />
            GIS Preview
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-blue-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{job.status}</p>
              <p className="text-xs text-muted-foreground">Job Status</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-green-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{outputEntries.length}</p>
              <p className="text-xs text-muted-foreground">Output Files</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-emerald-600">
              <Map className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{gisOutputs.length}</p>
              <p className="text-xs text-muted-foreground">GIS Outputs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{(job.qc_flags || []).length}</p>
              <p className="text-xs text-muted-foreground">QC Flags</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Output Files</CardTitle>
          <CardDescription>Generated output files from the pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          {outputEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No output files available</p>
          ) : (
            <div className="space-y-2">
              {outputEntries.map(([key, path]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md bg-muted/30 p-3 hover:bg-muted/50"
                  data-testid={`output-${key}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{key.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground font-mono">{path}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="uppercase text-xs">
                    {path?.split('.').pop() || 'file'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {gisOutputs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GIS Outputs</CardTitle>
            <CardDescription>Shapefiles and map files generated by the pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {gisOutputs.map((path, i) => {
                const filename = path.split('/').pop() || path;
                const ext = filename.split('.').pop() || '';
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md bg-muted/30 p-3 hover:bg-muted/50"
                    data-testid={`gis-output-${i}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                        <Map className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium font-mono">{filename}</p>
                    </div>
                    <Badge variant="outline" className="uppercase text-xs">{ext}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {job.logs && job.logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline Logs</CardTitle>
            <CardDescription>Processing log output</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto rounded-md bg-muted/30 p-4 font-mono text-xs">
              {job.logs.map((log, i) => (
                <div key={i} className={log.includes('ERROR') ? 'text-destructive' : ''}>
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

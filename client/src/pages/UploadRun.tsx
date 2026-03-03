import { useState, useCallback, useRef, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/api/client';
import { Upload, FileSpreadsheet, X, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { Job } from '@/types';

interface UploadedFile {
  file: File;
  type: 'observations' | 'fieldvisits';
  status: 'pending' | 'validated' | 'error';
}

export default function UploadRun() {
  const { activeProject } = useProject();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const validateFile = useCallback((file: File): UploadedFile | null => {
    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Invalid file', description: 'Only CSV files are accepted', variant: 'destructive' });
      return null;
    }

    const nameLower = file.name.toLowerCase();
    let type: 'observations' | 'fieldvisits';
    
    if (nameLower.includes('observation') || nameLower.includes('waarnemi')) {
      type = 'observations';
    } else if (nameLower.includes('field') || nameLower.includes('veldbezoek')) {
      type = 'fieldvisits';
    } else {
      toast({ 
        title: 'Unknown file type', 
        description: 'File should contain "observations" or "fieldvisits" in the name',
        variant: 'destructive' 
      });
      return null;
    }

    if (files.some(f => f.type === type)) {
      toast({ title: 'Duplicate', description: `A ${type} file is already uploaded`, variant: 'destructive' });
      return null;
    }

    return { file, type, status: 'validated' };
  }, [files, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.map(validateFile).filter((f): f is UploadedFile => f !== null);
    setFiles(prev => [...prev, ...validFiles]);
  }, [validateFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.map(validateFile).filter((f): f is UploadedFile => f !== null);
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (type: 'observations' | 'fieldvisits') => {
    setFiles(prev => prev.filter(f => f.type !== type));
  };

  const pollJobStatus = (jobId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const job = await api.jobs.get(jobId);
        setCurrentJob(job);
        setLogs(job.logs || []);

        if (job.status === 'SUCCEEDED' || job.status === 'FAILED') {
          if (pollRef.current) clearInterval(pollRef.current);
          setIsRunning(false);
          toast({
            title: job.status === 'SUCCEEDED' ? 'Pipeline completed' : 'Pipeline failed',
            description: job.status === 'SUCCEEDED' ? 'Job finished successfully' : 'Check logs for details',
            variant: job.status === 'FAILED' ? 'destructive' : 'default',
          });
        }
      } catch {
        // polling failed, will retry
      }
    }, 3000);
  };

  const runPipeline = async () => {
    if (!activeProject) {
      toast({ title: 'No project selected', description: 'Please select a project first', variant: 'destructive' });
      return;
    }

    const observationsFile = files.find(f => f.type === 'observations');
    if (!observationsFile) {
      toast({ title: 'Missing file', description: 'Please upload an observations file', variant: 'destructive' });
      return;
    }

    setIsRunning(true);
    setLogs([]);
    
    try {
      const timestamp = () => new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setLogs(prev => [...prev, `[${timestamp()}] Uploading files to server...`]);
      
      const rawFiles = files.map(f => f.file);
      const uploadResult = await api.uploads.upload(activeProject.id, rawFiles);
      
      setLogs(prev => [...prev, `[${timestamp()}] Files uploaded successfully (upload_id: ${uploadResult.upload_id})`]);
      setLogs(prev => [...prev, `[${timestamp()}] Starting pipeline job...`]);

      const job = await api.jobs.create(activeProject.id, activeProject.name, uploadResult.upload_id);
      setCurrentJob(job);
      
      setLogs(prev => [...prev, `[${timestamp()}] Job created: ${job.id}`]);
      setLogs(prev => [...prev, `[${timestamp()}] Pipeline is running... (polling for status)`]);

      pollJobStatus(job.id);
    } catch (err) {
      setIsRunning(false);
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast({ title: 'Pipeline failed', description: message, variant: 'destructive' });
      setLogs(prev => [...prev, `[ERROR] ${message}`]);
    }
  };

  const hasObservations = files.some(f => f.type === 'observations');
  const hasFieldvisits = files.some(f => f.type === 'fieldvisits');
  const canRun = hasObservations && activeProject && !isRunning;

  return (
    <div className="grid h-full gap-6 p-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Upload & Run</h1>
          <p className="text-sm text-muted-foreground">Upload CSV files and run the data processing pipeline</p>
        </div>

        {!activeProject && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Please select a project from the dropdown above before uploading files.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Required Files</CardTitle>
            <CardDescription>Upload CSV files to run the pipeline (observations required, field visits optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`rounded-md border p-3 ${hasObservations ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30' : 'border-dashed'}`}>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className={`h-4 w-4 ${hasObservations ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">observations.csv</span>
                  {hasObservations && <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Required</p>
              </div>
              <div className={`rounded-md border p-3 ${hasFieldvisits ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30' : 'border-dashed'}`}>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className={`h-4 w-4 ${hasFieldvisits ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">fieldvisits.csv</span>
                  {hasFieldvisits && <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Optional</p>
              </div>
            </div>

            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              data-testid="dropzone"
            >
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium">Drag and drop CSV files here</p>
              <p className="mb-3 text-xs text-muted-foreground">or click to browse</p>
              <input
                type="file"
                accept=".csv"
                multiple
                className="hidden"
                id="file-input"
                onChange={handleFileInput}
                data-testid="input-file"
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="file-input" className="cursor-pointer">
                  Browse Files
                </label>
              </Button>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.type} className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{f.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(f.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{f.type}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(f.type)}
                        data-testid={`button-remove-${f.type}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!canRun}
              onClick={runPipeline}
              data-testid="button-run-pipeline"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Pipeline...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Pipeline
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col">
        <Card className="flex flex-1 flex-col">
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-base">Pipeline Logs</CardTitle>
              <CardDescription>Real-time processing output</CardDescription>
            </div>
            {currentJob && (
              <Badge
                variant={
                  currentJob.status === 'SUCCEEDED' ? 'default' :
                  currentJob.status === 'RUNNING' ? 'secondary' :
                  currentJob.status === 'FAILED' ? 'destructive' : 'outline'
                }
              >
                {currentJob.status}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-[400px] rounded-md bg-muted/30 p-4 font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">Pipeline logs will appear here...</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, i) => (
                    <div key={i} className={log.includes('ERROR') ? 'text-destructive' : log.includes('completed') || log.includes('successfully') ? 'text-green-600 dark:text-green-400' : ''}>
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

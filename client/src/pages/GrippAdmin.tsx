import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { GrippFilesGrouped } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Database, Trash2, Upload, CheckCircle2, XCircle, FileSpreadsheet } from 'lucide-react';

const FILE_CATEGORIES: { key: keyof GrippFilesGrouped; label: string; hint: string }[] = [
  { key: 'project_info',    label: 'Project info',    hint: 'project_info_*.csv' },
  { key: 'client_company',  label: 'Client company',  hint: 'client_company_*.csv' },
  { key: 'client_contact',  label: 'Client contact',  hint: 'client_contact_*.csv' },
  { key: 'employees',       label: 'Employees',        hint: 'employees_*.csv' },
];

export default function GrippAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResult, setUploadResult] = useState<{ saved: unknown[]; errors: unknown[] } | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ['/gripp-admin/files'],
    queryFn: () => api.grippAdmin.listFiles(),
  });

  const uploadMutation = useMutation({
    mutationFn: (fs: File[]) => api.grippAdmin.upload(fs),
    onSuccess: (result) => {
      setUploadResult(result);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['/gripp-admin/files'] });
      toast({ title: 'Upload complete', description: `${(result.saved as unknown[]).length} file(s) saved.` });
    },
    onError: (err: Error) => {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (blobName: string) => api.grippAdmin.deleteFile(blobName),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/gripp-admin/files'] });
      toast({ title: 'File deleted', description: result.deleted });
    },
    onError: (err: Error) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setSelectedFiles(picked);
    setUploadResult(null);
  }

  function handleUpload() {
    if (selectedFiles.length === 0) return;
    uploadMutation.mutate(selectedFiles);
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Gripp Data Admin</h1>
          <p className="text-sm text-muted-foreground">Manage Gripp CSV exports in Azure Blob Storage</p>
        </div>
      </div>

      {/* Upload section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload new files
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-dashed p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Expected filename prefixes:</p>
            <div className="flex flex-wrap gap-2">
              {FILE_CATEGORIES.map(c => (
                <code key={c.key} className="text-xs bg-background border rounded px-2 py-0.5">{c.hint}</code>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="gripp-file-input"
              data-testid="input-csv-files"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-select-files"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Select CSV files
            </Button>
            {selectedFiles.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          {selectedFiles.length > 0 && (
            <ul className="space-y-1">
              {selectedFiles.map(f => (
                <li key={f.name} className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                  {f.name}
                  <span className="text-xs text-muted-foreground">({(f.size / 1024).toFixed(1)} KB)</span>
                </li>
              ))}
            </ul>
          )}

          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploadMutation.isPending}
            data-testid="button-upload-csv"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
          </Button>

          {uploadResult && (
            <div className="space-y-2">
              {(uploadResult.saved as string[]).length > 0 && (
                <div className="space-y-1">
                  {(uploadResult.saved as string[]).map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {typeof s === 'string' ? s : JSON.stringify(s)}
                    </div>
                  ))}
                </div>
              )}
              {(uploadResult.errors as string[]).length > 0 && (
                <div className="space-y-1">
                  {(uploadResult.errors as string[]).map((err, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                      <XCircle className="h-4 w-4 shrink-0" />
                      {typeof err === 'string' ? err : JSON.stringify(err)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current files section */}
      <div>
        <h2 className="text-base font-semibold mb-4">Current files in storage</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {FILE_CATEGORIES.map(c => (
              <Card key={c.key}>
                <CardHeader><CardTitle className="text-sm">{c.label}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {FILE_CATEGORIES.map(c => {
              const fileList = files?.[c.key] ?? [];
              return (
                <Card key={c.key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{c.label}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {fileList.length} file{fileList.length !== 1 ? 's' : ''}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fileList.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No files uploaded yet</p>
                    ) : (
                      <ul className="space-y-1">
                        {fileList.map((blobName) => (
                          <li
                            key={blobName}
                            className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-muted/50"
                            data-testid={`file-row-${blobName}`}
                          >
                            <span className="truncate text-xs">{blobName}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteMutation.mutate(blobName)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${blobName}`}
                              title={`Delete ${blobName}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

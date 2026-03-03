import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
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
import { api } from '@/api/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Search, 
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  Loader2,
} from 'lucide-react';
import type { QCFlag, Job } from '@/types';

type QCFlagStatus = 'OPEN' | 'APPROVED' | 'OVERRIDDEN';

const statusConfig: Record<string, { className: string; icon: typeof ShieldCheck }> = {
  OPEN: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle },
  APPROVED: { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: ShieldCheck },
  OVERRIDDEN: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: ShieldX },
};

export default function QC() {
  const params = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const jobId = params.jobId;

  const [flags, setFlags] = useState<QCFlag[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<QCFlagStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (!jobId) return;
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [jobData, flagsData] = await Promise.all([
        api.jobs.get(jobId!),
        api.jobs.getQCFlags(jobId!).catch(() => []),
      ]);
      setJob(jobData);
      setFlags(flagsData);
    } catch {
      toast({ title: 'Error', description: 'Failed to load QC data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFlags = flags.filter(flag => {
    const flagStatus = flag.status || 'OPEN';
    if (filterStatus !== 'ALL' && flagStatus !== filterStatus) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        (flag.veldbezoek_id || '').toLowerCase().includes(searchLower) ||
        (flag.reason || '').toLowerCase().includes(searchLower) ||
        (flag.flag_type || '').toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const statusCounts = {
    OPEN: flags.filter(f => (f.status || 'OPEN') === 'OPEN').length,
    APPROVED: flags.filter(f => f.status === 'APPROVED').length,
    OVERRIDDEN: flags.filter(f => f.status === 'OVERRIDDEN').length,
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
      <div className="flex items-center gap-4">
        {jobId && (
          <Button variant="ghost" size="icon" onClick={() => setLocation('/jobs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-semibold">QC Flags</h1>
          <p className="text-sm text-muted-foreground">
            {job ? `Quality control flags for ${job.project_name || 'Unknown'}` : 'Quality control flags'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(['OPEN', 'APPROVED', 'OVERRIDDEN'] as QCFlagStatus[]).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <Card 
              key={status} 
              className={`cursor-pointer ${filterStatus === status ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFilterStatus(filterStatus === status ? 'ALL' : status)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${config.className}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{statusCounts[status]}</p>
                  <p className="text-xs text-muted-foreground capitalize">{status.toLowerCase()}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-4">
          <div>
            <CardTitle className="text-base">Flag List</CardTitle>
            <CardDescription>{filteredFlags.length} flags found</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search flags..."
              className="w-[200px] pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-flags"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[160px]">Flag Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-[140px]">Veldbezoek ID</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No QC flags found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFlags.map((flag, i) => {
                    const flagStatus = flag.status || 'OPEN';
                    const config = statusConfig[flagStatus] || statusConfig.OPEN;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={i} data-testid={`row-flag-${i}`}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {flag.flag_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{flag.reason}</p>
                          {flag.comment && (
                            <p className="mt-1 text-xs text-muted-foreground italic">
                              Comment: {flag.comment}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{flag.veldbezoek_id || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 border-0 ${config.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {flagStatus}
                          </Badge>
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

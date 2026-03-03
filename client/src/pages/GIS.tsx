import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { api } from '@/api/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Map as MapIcon, 
  Folder,
  Loader2,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { Job } from '@/types';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export default function GIS() {
  const params = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const jobId = params.jobId;

  const [job, setJob] = useState<Job | null>(null);
  const [gisOutputs, setGisOutputs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [jobData, gisData] = await Promise.all([
        api.jobs.get(jobId!),
        api.jobs.getGISOutputs(jobId!).catch(() => []),
      ]);
      setJob(jobData);
      setGisOutputs(gisData);
    } catch {
      toast({ title: 'Error', description: 'Failed to load GIS data', variant: 'destructive' });
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
            <MapIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-semibold">Job Not Found</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              The job you're looking for doesn't exist.
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

  const center: [number, number] = [52.0907, 5.1214];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/jobs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">GIS Preview</h1>
            <p className="text-sm text-muted-foreground">
              {job.project_name || 'Unknown'} • Job {job.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation(`/results/${jobId}`)}>
            View Results
          </Button>
          <Button variant="outline" onClick={() => setLocation(`/qc/${jobId}`)}>
            QC Flags
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Map Preview</CardTitle>
            <CardDescription>Overview map centered on Netherlands</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] overflow-hidden rounded-lg border">
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Folder className="h-4 w-4" />
            GIS Output Files
          </CardTitle>
          <CardDescription>{gisOutputs.length} files generated</CardDescription>
        </CardHeader>
        <CardContent>
          {gisOutputs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No GIS output files available</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {gisOutputs.map((path, i) => {
                const filename = path.split('/').pop() || path;
                const ext = filename.split('.').pop() || '';
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md bg-muted/30 p-3 hover:bg-muted/50"
                    data-testid={`gis-artifact-${i}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                        <MapIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium font-mono">{filename}</p>
                        <p className="text-xs text-muted-foreground font-mono">{path}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="uppercase text-xs">{ext}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

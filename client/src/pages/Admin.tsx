import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateTime } from '@/utils/safeName';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  Database, 
  HardDrive, 
  RefreshCw,
  Settings,
} from 'lucide-react';

interface AdminSettings {
  enableAiAssist: boolean;
  enableRandomFailures: boolean;
}

interface HealthStatus {
  status: 'OK' | 'DEGRADED' | 'DOWN';
  database: 'OK' | 'ERROR';
  storage: 'OK' | 'ERROR';
  lastCheck: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettings>({
    enableAiAssist: true,
    enableRandomFailures: false,
  });
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'OK',
    database: 'OK',
    storage: 'OK',
    lastCheck: new Date().toISOString(),
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSettingChange = (key: keyof AdminSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: 'Setting Updated',
      description: `${key} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const handleRefreshHealth = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setHealthStatus(prev => ({ ...prev, lastCheck: new Date().toISOString() }));
    setIsRefreshing(false);
    toast({ title: 'Health Check', description: 'System health refreshed' });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">System administration and configuration</p>
      </div>

      <Tabs defaultValue="health" className="space-y-6">
        <TabsList>
          <TabsTrigger value="health" className="gap-2" data-testid="tab-health">
            <Heart className="h-4 w-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2" data-testid="tab-settings">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">System Health</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshHealth}
              disabled={isRefreshing}
              data-testid="button-refresh-health"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  healthStatus.status === 'OK' 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">Overall Status</p>
                  <p className={`text-xl font-bold ${
                    healthStatus.status === 'OK' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {healthStatus.status}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  healthStatus.database === 'OK' 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">Database</p>
                  <p className={`text-xl font-bold ${
                    healthStatus.database === 'OK' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {healthStatus.database}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  healthStatus.storage === 'OK' 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  <HardDrive className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">Storage</p>
                  <p className={`text-xl font-bold ${
                    healthStatus.storage === 'OK' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {healthStatus.storage}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            Last checked: {formatDateTime(healthStatus.lastCheck)}
          </p>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h2 className="text-lg font-medium">Feature Toggles</h2>

          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-assist" className="text-base">Enable AI Assist</Label>
                  <p className="text-sm text-muted-foreground">
                    Use AI to suggest species identification and data corrections
                  </p>
                </div>
                <Switch
                  id="ai-assist"
                  checked={settings.enableAiAssist}
                  onCheckedChange={(v) => handleSettingChange('enableAiAssist', v)}
                  data-testid="switch-ai-assist"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="random-failures" className="text-base">Enable Random Failures</Label>
                  <p className="text-sm text-muted-foreground">
                    Simulate random pipeline failures for testing
                  </p>
                </div>
                <Switch
                  id="random-failures"
                  checked={settings.enableRandomFailures}
                  onCheckedChange={(v) => handleSettingChange('enableRandomFailures', v)}
                  data-testid="switch-random-failures"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

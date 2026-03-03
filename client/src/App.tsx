import { Switch, Route, useLocation, Redirect } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Topbar } from '@/components/layout/Topbar';

import Login from '@/pages/Login';
import Projects from '@/pages/Projects';
import UploadRun from '@/pages/UploadRun';
import Jobs from '@/pages/Jobs';
import Results from '@/pages/Results';
import QC from '@/pages/QC';
import GIS from '@/pages/GIS';
import Reports from '@/pages/Reports';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/not-found';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated && location !== '/login') {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    '--sidebar-width': '16rem',
    '--sidebar-width-icon': '3rem',
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/projects" /> : <Login />}
      </Route>
      
      <Route path="/">
        <ProtectedRoute>
          <Redirect to="/projects" />
        </ProtectedRoute>
      </Route>

      <Route path="/projects">
        <ProtectedRoute>
          <AppLayout>
            <Projects />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/upload-run">
        <ProtectedRoute>
          <AppLayout>
            <UploadRun />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/jobs">
        <ProtectedRoute>
          <AppLayout>
            <Jobs />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/results/:jobId">
        <ProtectedRoute>
          <AppLayout>
            <Results />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/results">
        <ProtectedRoute>
          <Redirect to="/jobs" />
        </ProtectedRoute>
      </Route>

      <Route path="/qc/:jobId">
        <ProtectedRoute>
          <AppLayout>
            <QC />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/qc">
        <ProtectedRoute>
          <AppLayout>
            <QC />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/gis/:jobId">
        <ProtectedRoute>
          <AppLayout>
            <GIS />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/gis">
        <ProtectedRoute>
          <Redirect to="/jobs" />
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute>
          <AppLayout>
            <Reports />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute>
          <AppLayout>
            <Admin />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ProjectProvider>
            <Router />
            <Toaster />
          </ProjectProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

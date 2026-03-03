import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md text-center">
        <CardContent className="p-8">
          <FileQuestion className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-semibold">Page Not Found</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button onClick={() => setLocation('/projects')} data-testid="button-go-home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Projects
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

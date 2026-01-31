'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

function SignContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const embedUrl = searchParams.get('url');

  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!embedUrl) {
      setError('No signing URL provided');
      setIsLoading(false);
      return;
    }

    // Listen for messages from the embedded iframe
    const handleMessage = (event: MessageEvent) => {
      // Verify the message is from DocuSeal
      if (event.data?.type === 'docuseal:completed') {
        setIsCompleted(true);
        setIsLoading(false);
      } else if (event.data?.type === 'docuseal:loaded') {
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [embedUrl]);

  if (!embedUrl) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No signing URL provided. Please check your link and try again.
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4"
          onClick={() => router.push('/')}
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center">Document Signed Successfully!</CardTitle>
            <CardDescription className="text-center">
              Your signature has been recorded and the document has been completed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push('/')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading signing form...</span>
          </div>
        </div>
      )}

      <iframe
        src={embedUrl}
        className="w-full flex-1 border-0"
        title="Document Signing"
        allow="camera; microphone"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}

export default function SignPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <SignContent />
    </Suspense>
  );
}

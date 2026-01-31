import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings2, Key, Globe } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your DocuSeal integration and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>DocuSeal API connection settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">API Key Status</p>
              <Badge variant={process.env.DOCUSEAL_API_KEY ? 'default' : 'destructive'}>
                {process.env.DOCUSEAL_API_KEY ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">API URL</p>
              <code className="block rounded bg-muted px-3 py-2 text-sm">
                {process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com'}
              </code>
            </div>
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Configuration:</p>
              <p className="text-muted-foreground">
                API settings are configured via environment variables in{' '}
                <code className="rounded bg-background px-1 py-0.5">.env.local</code>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Application Settings
            </CardTitle>
            <CardDescription>General application preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Max File Size</p>
              <p className="text-sm text-muted-foreground">
                {process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '10'} MB
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Allowed File Types</p>
              <p className="text-sm text-muted-foreground">.docx (Microsoft Word)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Environment Variables
            </CardTitle>
            <CardDescription>
              Configure these in your .env.local file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-md bg-muted p-4 font-mono text-sm">
                <div className="space-y-1">
                  <p># DocuSeal API Configuration</p>
                  <p>DOCUSEAL_API_KEY=your_docuseal_api_key_here</p>
                  <p>DOCUSEAL_API_URL=https://api.docuseal.com</p>
                  <p className="mt-2"># Application Settings</p>
                  <p>NEXT_PUBLIC_APP_NAME=DocuSeal Template Builder</p>
                  <p>NEXT_PUBLIC_MAX_FILE_SIZE_MB=10</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                For EU region, use <code className="rounded bg-muted px-1 py-0.5">
                  https://api.docuseal.eu
                </code> for DOCUSEAL_API_URL
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

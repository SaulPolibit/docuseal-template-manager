'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings2, Key, Globe, Database, Loader2, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        toast.error('Please login to access settings');
        router.push('/login');
        return;
      }

      setUser(user);
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your DocuSeal integration and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Full Name</p>
              <p className="text-sm text-muted-foreground">
                {user?.user_metadata?.full_name || 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Account Created</p>
              <p className="text-sm text-muted-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Supabase Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Supabase Configuration
            </CardTitle>
            <CardDescription>Authentication database settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Supabase URL Status</p>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'default' : 'destructive'}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Supabase Project</p>
              <code className="block rounded bg-muted px-3 py-2 text-sm break-all">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
              </code>
            </div>
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Status:</p>
              <p className="text-muted-foreground">
                Authentication is {user ? '✅ Active' : '❌ Inactive'}
              </p>
            </div>
          </CardContent>
        </Card>

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
                  <p className="mt-2"># Supabase Configuration</p>
                  <p>NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co</p>
                  <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key</p>
                  <p>SUPABASE_SERVICE_ROLE_KEY=your_service_role_key</p>
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

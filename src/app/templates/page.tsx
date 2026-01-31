'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, FileText, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface Template {
  id: number;
  name: string;
  folder_name?: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
  fields?: Array<{ name: string; type: string; required: boolean }>;
  submitters?: Array<{ name: string; uuid: string }>;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        toast.error('Please login to access templates');
        router.push('/login');
        return;
      }

      setIsCheckingAuth(false);
      fetchTemplates();
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    }
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/docuseal/templates');

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      // DocuSeal API returns { data: [...] }
      const templatesArray = data.data || data;
      setTemplates(Array.isArray(templatesArray) ? templatesArray : []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error(error.message || 'Failed to load templates');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Manage your DocuSeal document templates
          </p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Create your first template by uploading a PDF file with field placeholders.
            </p>
            <Button asChild>
              <Link href="/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            // Get roles from submitters
            const roles = template.submitters?.map((s: any) => s.name) || [];

            return (
              <Card key={template.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-primary" />
                    <Badge variant="outline" className="ml-2">
                      {template.fields?.length || 0} fields
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-1">{template.name}</CardTitle>
                  <CardDescription className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Created {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {roles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {roles.slice(0, 3).map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                        {roles.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{roles.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/templates/${template.id}`}>View</Link>
                    </Button>
                    <Button asChild className="flex-1">
                      <Link href={`/submissions/new?template=${template.id}`}>
                        Use Template
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

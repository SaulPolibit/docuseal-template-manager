'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileText, Calendar, User, Mail, ExternalLink, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TemplateField {
  name: string;
  type: string;
  required: boolean;
  readonly?: boolean;
  submitter_uuid: string;
  uuid: string;
}

interface Submitter {
  name: string;
  uuid: string;
}

interface Template {
  id: number;
  name: string;
  folder_name?: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
  fields?: TemplateField[];
  submitters?: Submitter[];
  documents?: Array<{
    id: number;
    uuid: string;
    url?: string;
    filename: string;
  }>;
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/docuseal/templates/${templateId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Template not found');
        }
        throw new Error('Failed to fetch template');
      }

      const data = await response.json();
      setTemplate(data);
    } catch (error: any) {
      console.error('Error fetching template:', error);
      setError(error.message || 'Failed to load template');
      toast.error(error.message || 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading template...</span>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Template Not Found</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              {error || 'The template you are looking for does not exist.'}
            </p>
            <Button asChild>
              <Link href="/templates">View All Templates</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create a map of submitter UUID to submitter name
  const submitterMap = new Map(
    template.submitters?.map((s) => [s.uuid, s.name]) || []
  );

  // Get unique roles
  const roles = Array.from(new Set(template.submitters?.map((s) => s.name) || []));

  // Group fields by role (submitter name)
  const fieldsByRole = roles.reduce((acc, role) => {
    const submitter = template.submitters?.find((s) => s.name === role);
    if (submitter) {
      acc[role] = template.fields?.filter((field) => field.submitter_uuid === submitter.uuid) || [];
    }
    return acc;
  }, {} as Record<string, TemplateField[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
            </div>
            {template.external_id && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <span>ID: {template.external_id}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/templates/${template.id}/edit`}>Edit</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/submissions/share-links?template=${template.id}`}>
              <Link2 className="mr-2 h-4 w-4" />
              Get Signing Link
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/submissions/new?template=${template.id}`}>
              <Mail className="mr-2 h-4 w-4" />
              Send for Signing
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{template.fields?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{template.documents?.length || 1}</div>
          </CardContent>
        </Card>
      </div>

      {template.folder_name && (
        <Card>
          <CardHeader>
            <CardTitle>Folder</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{template.folder_name}</Badge>
          </CardContent>
        </Card>
      )}

      {template.documents && template.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Files attached to this template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {template.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{doc.filename}</span>
                  </div>
                  {doc.url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fields by Role</CardTitle>
          <CardDescription>
            Fields organized by signer roles ({template.fields?.length || 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {roles.map((role) => (
              <div key={role} className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{role}</h3>
                  <Badge variant="secondary">{fieldsByRole[role]?.length || 0} fields</Badge>
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {fieldsByRole[role]?.map((field) => (
                    <div
                      key={field.uuid}
                      className="p-3 border rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{field.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        {field.required && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {field.readonly && (
                          <Badge variant="secondary" className="text-xs">
                            Read-only
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {(!template.fields || template.fields.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No fields configured for this template
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

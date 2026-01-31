'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Calendar, User, ExternalLink, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Submitter {
  id: number;
  uuid: string;
  email: string;
  name?: string;
  role: string;
  status: string;
  completed_at?: string;
  submission_url?: string;
  values?: Record<string, any>[];
}

interface Submission {
  id: number;
  template_id: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  archived_at?: string;
  status: string;
  source: string;
  submitters: Submitter[];
  audit_log_url?: string;
  combined_document_url?: string;
  template?: {
    id: number;
    name: string;
  };
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/docuseal/submissions/${submissionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Submission not found');
        }
        throw new Error('Failed to fetch submission');
      }

      const data = await response.json();
      setSubmission(data);
    } catch (error: any) {
      console.error('Error fetching submission:', error);
      setError(error.message || 'Failed to load submission');
      toast.error(error.message || 'Failed to load submission');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'sent':
      case 'awaiting':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading submission...</span>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Submission Not Found</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              {error || 'The submission you are looking for does not exist.'}
            </p>
            <Button asChild>
              <Link href="/submissions">View All Submissions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedSubmitters = submission.submitters.filter((s) => s.status === 'completed').length;
  const totalSubmitters = submission.submitters.length;

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
          <h1 className="text-3xl font-bold tracking-tight">
            Submission #{submission.id}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created {new Date(submission.created_at).toLocaleDateString()}</span>
            </div>
            {submission.completed_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Completed {new Date(submission.completed_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        <Badge className={getStatusColor(submission.status)}>{submission.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submission.status}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedSubmitters}/{totalSubmitters}
            </div>
            <p className="text-xs text-muted-foreground">Signatures completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Template</CardTitle>
          </CardHeader>
          <CardContent>
            {submission.template ? (
              <Link
                href={`/templates/${submission.template_id}`}
                className="text-sm text-primary hover:underline"
              >
                {submission.template.name}
              </Link>
            ) : (
              <span className="text-sm">Template #{submission.template_id}</span>
            )}
          </CardContent>
        </Card>
      </div>

      {(submission.combined_document_url || submission.audit_log_url) && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Download completed documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {submission.combined_document_url && (
                <Button asChild variant="outline">
                  <a
                    href={submission.combined_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              )}
              {submission.audit_log_url && (
                <Button asChild variant="outline">
                  <a href={submission.audit_log_url} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Audit Log
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Submitters</CardTitle>
          <CardDescription>
            People who need to sign this document ({completedSubmitters}/{totalSubmitters}{' '}
            completed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {submission.submitters.map((submitter) => (
              <div
                key={submitter.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {submitter.name || submitter.email}
                      </p>
                      {submitter.name && (
                        <p className="text-sm text-muted-foreground">{submitter.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-8">
                    <Badge variant="outline">{submitter.role}</Badge>
                    <Badge className={getStatusColor(submitter.status)}>
                      {submitter.status}
                    </Badge>
                  </div>
                  {submitter.completed_at && (
                    <p className="text-xs text-muted-foreground ml-8">
                      Completed on {new Date(submitter.completed_at).toLocaleString()}
                    </p>
                  )}
                </div>
                {submitter.submission_url && submitter.status !== 'completed' && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/sign?url=${encodeURIComponent(submitter.submission_url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Form
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

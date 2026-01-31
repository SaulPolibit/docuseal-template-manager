'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Send, Loader2, Calendar, User, Copy, Check, ExternalLink, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface Submission {
  id: number;
  slug?: string;
  template_id: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  status: string;
  audit_log_url?: string;
  combined_document_url?: string;
  template?: {
    id: number;
    name: string;
  };
  submitters: Array<{
    id: number;
    uuid: string;
    slug: string;
    email: string;
    name?: string;
    role: string;
    status: string;
    embed_src?: string;
    submission_url?: string;
    sent_at?: string;
    opened_at?: string;
    completed_at?: string;
    declined_at?: string;
  }>;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/docuseal/submissions');

      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      console.log('API Response:', data);

      // DocuSeal API returns { data: [...], pagination: {...} }
      let submissionsArray: any[] = [];

      if (data.data && Array.isArray(data.data)) {
        // Standard response format
        submissionsArray = data.data;
      } else if (Array.isArray(data)) {
        // Direct array response
        submissionsArray = data;
      } else if (data.submission_id) {
        // Single submitter returned - this is wrong, should be submissions
        console.error('Received submitter instead of submission:', data);
        toast.error('API returned incorrect data format. Expected submissions, got submitters.');
        setSubmissions([]);
        return;
      }

      // Filter out any submitter objects that might have been returned
      const validSubmissions = submissionsArray.filter((item: any) => {
        // Submissions have an id and submitters array, not submission_id
        return item.id && !item.submission_id && (item.submitters || item.status);
      });

      console.log('Valid submissions:', validSubmissions);
      setSubmissions(validSubmissions);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      toast.error(error.message || 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'pending':
      case 'awaiting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'opened':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates({ ...copiedStates, [key]: true });
      toast.success('Link copied to clipboard!');

      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [key]: false });
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading submissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
          <p className="text-muted-foreground">
            Create submissions and share signing links with customers
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/submissions/share-links">
              <Link2 className="mr-2 h-4 w-4" />
              Create Submission
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/submissions/new">
              <Send className="mr-2 h-4 w-4" />
              Send via Email
            </Link>
          </Button>
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Create a submission from a template and get signing links to share with customers.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/submissions/share-links">
                  <Link2 className="mr-2 h-4 w-4" />
                  Create Submission
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/submissions/new">
                  <Send className="mr-2 h-4 w-4" />
                  Send via Email
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      Submission #{submission.id}
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {new Date(submission.created_at).toLocaleDateString()}
                      </span>
                      {submission.completed_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Completed {new Date(submission.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/submissions/${submission.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-3">Signers & Links:</p>
                    <div className="space-y-3">
                      {(submission.submitters || []).map((submitter, index) => {
                        const copyKey = `${submission.id}-${submitter.id}`;
                        return (
                          <div
                            key={submitter.id || index}
                            className="p-3 border rounded-lg space-y-2 bg-muted/30"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">
                                    {submitter.name || submitter.email}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {submitter.role}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(submitter.status)}>
                                  {submitter.status}
                                </Badge>
                              </div>
                            </div>

                            {(submitter.embed_src || submitter.submission_url) && submitter.status !== 'completed' && (
                              <div className="flex gap-2">
                                <Input
                                  value={submitter.embed_src || submitter.submission_url || ''}
                                  readOnly
                                  className="font-mono text-xs h-9"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(submitter.embed_src || submitter.submission_url || '', copyKey)}
                                >
                                  {copiedStates[copyKey] ? (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-1" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a
                                    href={submitter.embed_src || submitter.submission_url || ''}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            )}

                            {submitter.status === 'completed' && submitter.completed_at && (
                              <p className="text-xs text-muted-foreground">
                                Signed on {new Date(submitter.completed_at).toLocaleString()}
                              </p>
                            )}
                            {submitter.status === 'opened' && submitter.opened_at && (
                              <p className="text-xs text-muted-foreground">
                                Opened on {new Date(submitter.opened_at).toLocaleString()}
                              </p>
                            )}
                            {submitter.status === 'sent' && submitter.sent_at && (
                              <p className="text-xs text-muted-foreground">
                                Sent on {new Date(submitter.sent_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {submission.template && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Template: <span className="font-medium">{submission.template.name}</span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Link2, Plus, Trash2, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Template {
  id: number;
  name: string;
  submitters?: Array<{ name: string; uuid: string }>;
}

interface SubmitterInput {
  role: string;
  email: string;
  name: string;
}

interface GeneratedLink {
  role: string;
  email: string;
  name?: string;
  url: string;
  copied: boolean;
}

function ShareLinksContent({ templateIdParam }: { templateIdParam: string | null }) {
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateIdParam || '');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [submitters, setSubmitters] = useState<SubmitterInput[]>([]);
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === parseInt(selectedTemplateId));
      setSelectedTemplate(template || null);

      // Initialize submitters based on template roles
      if (template?.submitters) {
        setSubmitters(
          template.submitters.map((s) => ({
            role: s.name,
            email: '',
            name: '',
          }))
        );
      }
    } else {
      setSelectedTemplate(null);
      setSubmitters([]);
    }
    // Reset generated links when template changes
    setGeneratedLinks([]);
    setSubmissionId(null);
  }, [selectedTemplateId, templates]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/docuseal/templates');

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
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

  const handleSubmitterChange = (index: number, field: keyof SubmitterInput, value: string) => {
    const newSubmitters = [...submitters];
    newSubmitters[index][field] = value;
    setSubmitters(newSubmitters);
  };

  const addSubmitter = () => {
    setSubmitters([
      ...submitters,
      {
        role: '',
        email: '',
        name: '',
      },
    ]);
  };

  const removeSubmitter = (index: number) => {
    setSubmitters(submitters.filter((_, i) => i !== index));
  };

  const generateLinks = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }

    if (submitters.length === 0) {
      toast.error('Please add at least one submitter');
      return;
    }

    // Validate all submitters have required fields
    const invalidSubmitters = submitters.filter((s) => !s.role);
    if (invalidSubmitters.length > 0) {
      toast.error('Please fill in role for all submitters');
      return;
    }

    // Check for duplicate roles - DocuSeal requires unique roles
    const roleSet = new Set(submitters.map(s => s.role));
    if (roleSet.size < submitters.length) {
      const duplicates = submitters
        .map(s => s.role)
        .filter((role, index, arr) => arr.indexOf(role) !== index);

      toast.error(
        `Each submitter must have a unique role. Duplicate role(s): ${[...new Set(duplicates)].join(', ')}. Use roles like "Client 1", "Client 2", etc.`,
        { duration: 5000 }
      );
      return;
    }

    setIsGenerating(true);

    try {
      const payload = {
        template_id: parseInt(selectedTemplateId),
        send_email: false, // Don't send emails, we'll share links manually
        submitters: submitters.map((s) => ({
          role: s.role,
          email: s.email || `placeholder_${Date.now()}_${Math.random()}@example.com`, // Placeholder email if not provided
          name: s.name || undefined,
        })),
      };

      const response = await fetch('/api/docuseal/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create submission');
      }

      const data = await response.json();
      console.log('Submission Response:', data);

      // Extract submitters from different possible response formats
      let responseSubmitters: any[] = [];
      let responseSubmissionId: number | null = null;

      // Format 1: Response has submitters array directly
      if (data.submitters && Array.isArray(data.submitters)) {
        responseSubmitters = data.submitters;
        responseSubmissionId = data.id || data.submission_id;
      }
      // Format 2: Response is an array of submitters
      else if (Array.isArray(data)) {
        responseSubmitters = data;
        responseSubmissionId = data[0]?.submission_id || null;
      }
      // Format 3: Response has numbered keys (0, 1, 2...)
      else if (typeof data === 'object' && data !== null) {
        // Check if it has numbered keys
        const keys = Object.keys(data);
        const hasNumberedKeys = keys.some(k => !isNaN(Number(k)));

        if (hasNumberedKeys) {
          // Convert object with numbered keys to array
          responseSubmitters = keys
            .filter(k => !isNaN(Number(k)))
            .sort((a, b) => Number(a) - Number(b))
            .map(k => data[k]);
          responseSubmissionId = responseSubmitters[0]?.submission_id || null;
        } else if (data.id && data.embed_src) {
          // Single submitter response
          responseSubmitters = [data];
          responseSubmissionId = data.submission_id || data.id;
        }
      }

      console.log('Parsed submitters:', responseSubmitters);
      console.log('Submission ID:', responseSubmissionId);

      if (responseSubmitters.length === 0) {
        throw new Error('No signing links returned from API');
      }

      setSubmissionId(responseSubmissionId);

      const links: GeneratedLink[] = responseSubmitters.map((submitter: any) => {
        // Get the submission URL from DocuSeal
        // Use embed_src if available (for embedded signing), otherwise use submission_url
        const url = submitter.embed_src || submitter.submission_url || submitter.embed_url || '';

        return {
          role: submitter.role,
          email: submitter.email,
          name: submitter.name,
          url: url,
          copied: false,
        };
      });

      setGeneratedLinks(links);
      toast.success('Signing links generated successfully!');
    } catch (error: any) {
      console.error('Error generating links:', error);
      toast.error(error.message || 'Failed to generate signing links');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (link: GeneratedLink, index: number) => {
    try {
      await navigator.clipboard.writeText(link.url);

      // Update copied state
      const newLinks = [...generatedLinks];
      newLinks[index].copied = true;
      setGeneratedLinks(newLinks);

      toast.success('Link copied to clipboard!');

      // Reset copied state after 2 seconds
      setTimeout(() => {
        const resetLinks = [...generatedLinks];
        resetLinks[index].copied = false;
        setGeneratedLinks(resetLinks);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const copyAllLinks = async () => {
    const allLinks = generatedLinks
      .map((link) => `${link.role}${link.name ? ` (${link.name})` : ''}: ${link.url}`)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(allLinks);
      toast.success('All links copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy links');
    }
  };

  const resetForm = () => {
    setGeneratedLinks([]);
    setSubmissionId(null);
    setSelectedTemplateId('');
    setSubmitters([]);
  };

  if (isLoading) {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Signing Links</h1>
        <p className="text-muted-foreground">
          Create shareable signing links without sending emails
        </p>
      </div>

      {generatedLinks.length > 0 ? (
        // Success view - show generated links
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Signing Links Generated
                    <Badge variant="secondary">Submission #{submissionId}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Share these links with your signers via email, messaging, or any other channel
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyAllLinks}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All
                  </Button>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedLinks.map((link, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">
                          {link.role}
                          {link.name && <span className="text-muted-foreground"> - {link.name}</span>}
                        </p>
                        {link.email && !link.email.includes('placeholder_') && (
                          <p className="text-xs text-muted-foreground">{link.email}</p>
                        )}
                      </div>
                      <Badge variant="outline">
                        <Link2 className="mr-1 h-3 w-3" />
                        Ready to share
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={link.url}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link, index)}
                      >
                        {link.copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {submissionId && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Track this submission:</strong> You can view the signing progress at{' '}
                    <Link
                      href={`/submissions/${submissionId}`}
                      className="underline hover:no-underline"
                    >
                      /submissions/{submissionId}
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Form view - create new links
        <form onSubmit={generateLinks} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Template</CardTitle>
              <CardDescription>
                Choose the template you want to send for signing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No templates available.{' '}
                    <Link href="/templates/new" className="text-primary hover:underline">
                      Create a template first
                    </Link>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedTemplate && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Signers</CardTitle>
                    <CardDescription>
                      Add the people who need to sign. Each signer must have a unique role (e.g., "Client 1", "Client 2").
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSubmitter}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Signer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submitters.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No signers added yet.</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={addSubmitter}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Signer
                      </Button>
                    </div>
                  ) : (
                    submitters.map((submitter, index) => (
                      <div
                        key={index}
                        className="flex gap-4 p-4 border rounded-lg items-end"
                      >
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={`role-${index}`}>
                            Role <span className="text-destructive">*</span>
                          </Label>
                          {selectedTemplate.submitters && selectedTemplate.submitters.length > 0 ? (
                            <Select
                              value={submitter.role}
                              onValueChange={(value) =>
                                handleSubmitterChange(index, 'role', value)
                              }
                            >
                              <SelectTrigger id={`role-${index}`}>
                                <SelectValue placeholder="Select role..." />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedTemplate.submitters.map((s) => (
                                  <SelectItem key={s.uuid} value={s.name}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={`role-${index}`}
                              value={submitter.role}
                              onChange={(e) =>
                                handleSubmitterChange(index, 'role', e.target.value)
                              }
                              placeholder={`e.g., Client ${index + 1}, Manager`}
                              required
                            />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={`name-${index}`}>Name (Optional)</Label>
                          <Input
                            id={`name-${index}`}
                            value={submitter.name}
                            onChange={(e) =>
                              handleSubmitterChange(index, 'name', e.target.value)
                            }
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={`email-${index}`}>Email (Optional)</Label>
                          <Input
                            id={`email-${index}`}
                            type="email"
                            value={submitter.email}
                            onChange={(e) =>
                              handleSubmitterChange(index, 'email', e.target.value)
                            }
                            placeholder="signer@example.com"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubmitter(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTemplate && submitters.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Generate Signing Links
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

function SearchParamsWrapper() {
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('template');
  return <ShareLinksContent templateIdParam={templateIdParam} />;
}

export default function ShareLinksPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <SearchParamsWrapper />
    </Suspense>
  );
}

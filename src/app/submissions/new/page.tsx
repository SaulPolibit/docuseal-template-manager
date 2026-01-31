'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Send, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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

function NewSubmissionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('template');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateIdParam || '');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [submitters, setSubmitters] = useState<SubmitterInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    const invalidSubmitters = submitters.filter((s) => !s.email || !s.role);
    if (invalidSubmitters.length > 0) {
      toast.error('Please fill in email and role for all submitters');
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

    setIsSubmitting(true);

    try {
      const payload = {
        template_id: parseInt(selectedTemplateId),
        send_email: true,
        submitters: submitters.map((s) => ({
          role: s.role,
          email: s.email,
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
      toast.success('Submission created successfully!');

      // Redirect to submissions page or the detail page
      router.push('/submissions');
    } catch (error: any) {
      console.error('Error creating submission:', error);
      toast.error(error.message || 'Failed to create submission');
    } finally {
      setIsSubmitting(false);
    }
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
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Submission</h1>
        <p className="text-muted-foreground">
          Send a template for signing by adding submitters
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  <CardTitle>Submitters</CardTitle>
                  <CardDescription>
                    Add the people who need to sign. Each submitter must have a unique role (e.g., "Client 1", "Client 2").
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addSubmitter}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Submitter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submitters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No submitters added yet.</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={addSubmitter}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Submitter
                    </Button>
                  </div>
                ) : (
                  submitters.map((submitter, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-4 border rounded-lg items-end"
                    >
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`role-${index}`}>Role</Label>
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
                        <Label htmlFor={`email-${index}`}>Email</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          value={submitter.email}
                          onChange={(e) =>
                            handleSubmitterChange(index, 'email', e.target.value)
                          }
                          placeholder="submitter@example.com"
                          required
                        />
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send for Signing
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

export default function NewSubmissionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <NewSubmissionPageContent />
    </Suspense>
  );
}

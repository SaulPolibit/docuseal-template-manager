'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileCheck, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTemplateStore } from '@/stores/templateStore';
import { ExtractedField } from '@/types';
import { toast } from 'sonner';
import { fileToBase64 } from '@/lib/extract-tags';

export default function NewTemplatePage() {
  const router = useRouter();
  const {
    setFields,
    setDocumentFile,
    setDocumentBase64,
    isProcessing,
    setIsProcessing,
    setError,
  } = useTemplateStore();

  const [templateName, setTemplateName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [fileType, setFileType] = useState<'pdf' | 'docx'>('pdf');
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setIsExtracting(true);
    setError(null);

    // Set default template name from file name
    if (!templateName) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTemplateName(nameWithoutExt);
    }

    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append('file', file);

      // Call API to extract coordinates
      const response = await fetch('/api/extract-coordinates', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extract fields');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to extract fields');
      }

      // Store extracted fields
      setExtractedFields(data.fields);
      setFields(data.fields);

      // Store file type from response
      if (data.fileType) {
        setFileType(data.fileType);
      }

      // Convert file to base64 and store
      const base64 = await fileToBase64(file);
      setDocumentFile(file);
      setDocumentBase64(base64);

      toast.success(`Extracted ${data.fields.length} fields from document`);
    } catch (error: any) {
      console.error('Error extracting fields:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to process document');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (!uploadedFile) {
      toast.error('Please upload a PDF or DOCX file');
      return;
    }

    if (extractedFields.length === 0) {
      toast.error('No fields found in document');
      return;
    }

    setIsProcessing(true);

    try {
      const base64 = await fileToBase64(uploadedFile);

      // Create template via API
      const response = await fetch('/api/docuseal/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          documentName: uploadedFile.name,
          documentBase64: base64,
          fields: extractedFields,
          fileType: fileType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }

      const template = await response.json();

      toast.success('Template created successfully!');
      router.push(`/templates/${template.id}`);
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast.error(error.message || 'Failed to create template');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/templates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Template</h1>
          <p className="text-muted-foreground">
            Upload a PDF or DOCX file with placeholders to create a template
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>Enter a name for your template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Service Agreement"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <FileUpload
            onFileSelect={handleFileSelect}
            onError={(error) => toast.error(error)}
          />

          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm space-y-2 text-blue-900 dark:text-blue-100">
                  <p className="font-semibold">How It Works</p>
                  <p>Place <code className="text-xs">{`{{tags}}`}</code> in your document where you want fields to appear. Our app automatically detects field types and roles from tag names, then DocuSeal positions fields exactly where the tags are. Tags are removed from the final document.</p>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                    <p><strong>Auto-detected:</strong></p>
                    <p><code>{`{{client_name}}`}</code> → Text field, Client role</p>
                    <p><code>{`{{provider_signature}}`}</code> → Signature field, Service Provider role</p>
                    <p><code>{`{{contract_date}}`}</code> → Date field</p>
                    <p className="mt-2"><strong>Manual override:</strong> <code>{`{{name;type=text;role=Manager}}`}</code></p>
                    <a
                      href="https://www.docuseal.com/examples/fieldtags.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Complete Field Tags Reference
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isExtracting && (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Extracting fields from document...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {extractedFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Extracted Fields ({extractedFields.length})
                </CardTitle>
                <CardDescription>
                  Fields found in your document with auto-detected types and roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {extractedFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{field.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {field.name}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <Badge variant="outline">{field.type}</Badge>
                        <Badge variant="secondary">{field.role}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {extractedFields.length > 0 && (
            <div className="space-y-3">
              <Button
                onClick={handleCreateTemplate}
                className="w-full"
                size="lg"
                disabled={isProcessing || !templateName.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Template...
                  </>
                ) : (
                  'Create Template'
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                You can adjust field positions and properties after creation
              </p>
            </div>
          )}
        </div>
      </div>

      {extractedFields.length === 0 && !isExtracting && uploadedFile && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">No tags found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Make sure your document contains placeholders in the format{' '}
              <code className="rounded bg-white dark:bg-gray-800 px-1 py-0.5">{`{{tag_name}}`}</code>
            </p>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Examples (roles auto-detected from tag names):</strong></p>
              <p><code className="rounded bg-white dark:bg-gray-800 px-1 py-0.5">{`{{client_name}}`}</code> → Client role, text field</p>
              <p><code className="rounded bg-white dark:bg-gray-800 px-1 py-0.5">{`{{provider_signature}}`}</code> → Service Provider role, signature field</p>
              <p><code className="rounded bg-white dark:bg-gray-800 px-1 py-0.5">{`{{contract_date}}`}</code> → Date field</p>
              <p className="mt-2 text-xs">
                <strong>Role patterns:</strong> Use <code>client_</code>, <code>customer_</code>, or <code>provider_</code>, <code>vendor_</code> prefixes for auto-detection.
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <strong>Note:</strong> Tags are removed from the final document. Fields appear exactly where you place tags.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

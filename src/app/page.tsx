import Link from 'next/link';
import { FileText, Send, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your DocuSeal templates and submissions
          </p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Templates
            </CardTitle>
            <CardDescription>
              Create and manage document templates with field placeholders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload PDF files with <code className="rounded bg-muted px-1 py-0.5">
                {`{{tag_name}}`}
              </code>{' '}
              placeholders to create reusable templates.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/templates">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/templates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Submissions
            </CardTitle>
            <CardDescription>
              Send templates to recipients for signing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create submissions from your templates and send them to recipients via email.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/submissions">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/submissions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Follow these steps to create your first template</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Prepare your PDF template</h3>
                <p className="text-sm text-muted-foreground">
                  Add placeholders like <code className="rounded bg-muted px-1 py-0.5">
                    {`{{client_name}}`}
                  </code>, <code className="rounded bg-muted px-1 py-0.5">
                    {`{{client_signature}}`}
                  </code>, etc. to your PDF document.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Upload and configure</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your PDF file, and the app will automatically extract tags and detect
                  field types and roles.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Adjust field positions</h3>
                <p className="text-sm text-muted-foreground">
                  Use the visual editor to fine-tune field positions, sizes, and properties.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                4
              </div>
              <div>
                <h3 className="font-semibold">Create and send</h3>
                <p className="text-sm text-muted-foreground">
                  Save your template to DocuSeal and create submissions to send for signing.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

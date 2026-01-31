import { NextRequest, NextResponse } from 'next/server';
import { createDocuSealClient } from '@/lib/docuseal';

/**
 * GET /api/docuseal/submissions/[id]
 * Get a specific submission by ID with status and documents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }

    const client = createDocuSealClient();
    const submission = await client.getSubmission(id);

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('Error fetching submission:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch submission',
        code: error.code || 'API_ERROR',
      },
      { status: error.code?.includes('404') ? 404 : 500 }
    );
  }
}

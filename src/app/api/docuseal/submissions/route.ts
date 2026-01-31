import { NextRequest, NextResponse } from 'next/server';
import { createDocuSealClient } from '@/lib/docuseal';
import { CreateSubmissionPayload } from '@/types';

/**
 * GET /api/docuseal/submissions
 * List all submissions (optionally filtered by template_id)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('template_id');

    const client = createDocuSealClient();
    const response = await client.getSubmissions(
      templateId ? parseInt(templateId) : undefined
    );

    console.log('DocuSeal API Response:', JSON.stringify(response, null, 2));

    // DocuSeal returns { data: [...], pagination: {...} }
    // Make sure we're returning the correct structure
    if (response && typeof response === 'object') {
      return NextResponse.json(response);
    }

    // Fallback: wrap in data object if needed
    return NextResponse.json({
      data: Array.isArray(response) ? response : [],
      pagination: { count: 0, next: null, prev: null }
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch submissions',
        code: error.code || 'API_ERROR',
      },
      { status: error.code === 'NETWORK_ERROR' ? 503 : 500 }
    );
  }
}

/**
 * POST /api/docuseal/submissions
 * Create a new submission (send document for signing)
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateSubmissionPayload = await request.json();

    // Validate required fields
    if (!body.template_id) {
      return NextResponse.json(
        {
          error: 'Missing required field: template_id',
        },
        { status: 400 }
      );
    }

    if (!body.submitters || !Array.isArray(body.submitters) || body.submitters.length === 0) {
      return NextResponse.json(
        {
          error: 'Submitters must be a non-empty array',
        },
        { status: 400 }
      );
    }

    // Validate each submitter has required fields
    for (const submitter of body.submitters) {
      if (!submitter.email) {
        return NextResponse.json(
          {
            error: 'Each submitter must have an email address',
          },
          { status: 400 }
        );
      }

      if (!submitter.role) {
        return NextResponse.json(
          {
            error: 'Each submitter must have a role',
          },
          { status: 400 }
        );
      }
    }

    // Create DocuSeal client and create submission
    const client = createDocuSealClient();
    const submission = await client.createSubmission(body);

    console.log('DocuSeal Submission Response:', JSON.stringify(submission, null, 2));

    // Ensure the response has the expected structure
    if (!submission) {
      return NextResponse.json(
        { error: 'No response from DocuSeal' },
        { status: 500 }
      );
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    console.error('Error creating submission:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to create submission',
        code: error.code || 'API_ERROR',
        details: error.details,
      },
      { status: error.code === 'NETWORK_ERROR' ? 503 : 500 }
    );
  }
}

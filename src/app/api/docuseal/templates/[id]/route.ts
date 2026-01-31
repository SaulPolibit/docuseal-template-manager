import { NextRequest, NextResponse } from 'next/server';
import { createDocuSealClient } from '@/lib/docuseal';

/**
 * GET /api/docuseal/templates/[id]
 * Get a specific template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const client = createDocuSealClient();
    const template = await client.getTemplate(id);

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error fetching template:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch template',
        code: error.code || 'API_ERROR',
      },
      { status: error.code?.includes('404') ? 404 : 500 }
    );
  }
}

/**
 * PUT /api/docuseal/templates/[id]
 * Update a specific template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const body = await request.json();
    const client = createDocuSealClient();
    const template = await client.updateTemplate(id, body);

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error updating template:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to update template',
        code: error.code || 'API_ERROR',
      },
      { status: error.code?.includes('404') ? 404 : 500 }
    );
  }
}

/**
 * DELETE /api/docuseal/templates/[id]
 * Archive a specific template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const client = createDocuSealClient();
    await client.archiveTemplate(id);

    return NextResponse.json({ success: true, message: 'Template archived successfully' });
  } catch (error: any) {
    console.error('Error archiving template:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to archive template',
        code: error.code || 'API_ERROR',
      },
      { status: error.code?.includes('404') ? 404 : 500 }
    );
  }
}

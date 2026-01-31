import { NextRequest, NextResponse } from 'next/server';
import { createDocuSealClient } from '@/lib/docuseal';
import { ExtractedField } from '@/types';

/**
 * GET /api/docuseal/templates
 * List all templates from DocuSeal
 */
export async function GET(request: NextRequest) {
  try {
    const client = createDocuSealClient();
    const templates = await client.getTemplates();

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Error fetching templates:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch templates',
        code: error.code || 'API_ERROR',
      },
      { status: error.code === 'NETWORK_ERROR' ? 503 : 500 }
    );
  }
}

/**
 * POST /api/docuseal/templates
 * Create a new template from PDF with fields
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, documentName, documentBase64, fields, externalId, folderName, fileType } = body;

    // Validate required fields
    if (!name || !documentName || !documentBase64 || !fields) {
      return NextResponse.json(
        {
          error: 'Missing required fields: name, documentName, documentBase64, fields',
        },
        { status: 400 }
      );
    }

    // Validate fields array
    if (!Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        {
          error: 'Fields must be a non-empty array',
        },
        { status: 400 }
      );
    }

    // Note: Coordinate validation removed
    // For tag-based templates ({{field_name}}), coordinates are NOT required
    // DocuSeal uses tags in the document for positioning and fields array for metadata only

    // Create DocuSeal client and create template
    // Hybrid approach: Tags in document for positioning + fields for roles/types
    const client = createDocuSealClient();
    const template = await client.createTemplate(
      name,
      documentName,
      documentBase64,
      fields,
      {
        externalId,
        folderName,
        fileType: fileType || 'pdf', // Default to PDF if not specified
      }
    );

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error('Error creating template:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to create template',
        code: error.code || 'API_ERROR',
        details: error.details,
      },
      { status: error.code === 'NETWORK_ERROR' ? 503 : 500 }
    );
  }
}

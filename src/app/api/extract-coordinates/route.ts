import { NextRequest, NextResponse } from 'next/server';
import { extractTagsFromPDF } from '@/lib/pdf-processor';
import { extractTagsFromDOCX } from '@/lib/docx-processor';
import { ExtractCoordinatesResponse, ExtractedField } from '@/types';

/**
 * API Route: Extract tags from PDF or DOCX file
 *
 * This endpoint:
 * 1. Receives a PDF or DOCX file (multipart)
 * 2. Extracts {{tags}} from the document text
 * 3. Infers field types and roles from tag names
 * 4. Returns discovered fields for preview/validation
 *
 * Hybrid Approach:
 * - Coordinates returned are for preview only (not sent to DocuSeal)
 * - Field metadata (name, type, role) IS sent to DocuSeal
 * - DocuSeal uses {{tags}} for positioning and our metadata for roles
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload a PDF or DOCX file.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Extract text and tags based on file type
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file type and use appropriate processor
    const isPDF = file.type === 'application/pdf';
    const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   file.type === 'application/msword';

    let fields: ExtractedField[];
    let pageCount: number;
    let extractedText: string | undefined;

    if (isPDF) {
      // Extract tags and coordinates from PDF
      const result = await extractTagsFromPDF(buffer);
      fields = result.fields;
      pageCount = result.pageCount;
      extractedText = result.extractedText;

      console.log('PDF Processing:');
      console.log('- Text Length:', extractedText?.length || 0);
      console.log('- Text Preview:', extractedText?.substring(0, 500));
      console.log('- Page Count:', pageCount);
      console.log('- Fields Found:', fields.length);
    } else if (isDOCX) {
      // Extract tags from DOCX
      const result = await extractTagsFromDOCX(buffer);
      fields = result.fields;
      extractedText = result.extractedText;
      // DOCX doesn't have native pages, estimate based on field count
      pageCount = Math.ceil(fields.length / 25) || 1;

      console.log('DOCX Processing:');
      console.log('- Text Length:', extractedText?.length || 0);
      console.log('- Text Preview:', extractedText?.substring(0, 500));
      console.log('- Estimated Pages:', pageCount);
      console.log('- Fields Found:', fields.length);
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    if (fields.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No {{tags}} found in document. Add placeholders like {{signature}} to your document.',
          debug: {
            textLength: extractedText?.length || 0,
            textPreview: extractedText?.substring(0, 200),
            hasText: !!extractedText && extractedText.length > 0,
          }
        },
        { status: 400 }
      );
    }

    // Convert file to base64 for preview
    const base64 = buffer.toString('base64');
    const mimeType = isPDF ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const response: ExtractCoordinatesResponse = {
      success: true,
      fields,
      pageCount,
      pdfPreviewUrl: `data:${mimeType};base64,${base64}`,
      fileType: isPDF ? 'pdf' : 'docx',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error extracting coordinates:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process document',
      },
      { status: 500 }
    );
  }
}

/**
 * This implementation supports both PDF and DOCX files:
 * - PDF: Uses pdfjs-dist to extract text and tags
 * - DOCX: Uses mammoth to extract text and tags
 *
 * HYBRID APPROACH:
 * This endpoint extracts tags and infers field metadata (types, roles).
 * When creating templates:
 * - {{tags}} in document → DocuSeal uses for field positioning
 * - Fields metadata (no coordinates) → DocuSeal uses for roles/types
 * - Tags are automatically removed from the final document
 *
 * This ensures:
 * 1. Fields appear exactly where tags are placed
 * 2. Roles are correctly assigned (even simple tags like {{client_name}})
 * 3. Tags are removed from the final document
 * 4. Users don't need to specify roles in every tag
 */

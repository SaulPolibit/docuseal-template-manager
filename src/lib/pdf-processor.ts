/**
 * PDF Processing Utilities
 * Helper functions for processing PDF files and extracting tag coordinates
 */

import { ExtractedField } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { inferFieldType, inferRole } from './infer-types';

/**
 * Extract text content and tag positions from PDF
 * Note: This uses a simplified approach with grid-based positioning
 * For exact coordinate extraction, you would need a more sophisticated PDF parser
 */
export async function extractTagsFromPDF(buffer: Buffer): Promise<{
  fields: ExtractedField[];
  pageCount: number;
  extractedText?: string;
}> {
  try {
    // Use pdfjs-dist instead of pdf-parse to avoid native dependencies
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;

    // Extract text from all pages
    let text = '';
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
    }

    console.log('PDF Parse Result:');
    console.log('- Page count:', pageCount);
    console.log('- Text length:', text.length);
    console.log('- Text preview:', text.substring(0, 500));

    const fields: ExtractedField[] = [];
    const processedTags = new Set<string>();

    // Find all {{tag}} patterns in the text
    const tagRegex = /\{\{([^}]+)\}\}/g;
    const matches = text.match(tagRegex);
    console.log('- Tags found:', matches);

    let match;

    // Use grid-based positioning since we can't get exact coordinates easily
    let currentPage = 1; // DocuSeal uses 1-indexed pages
    let currentY = 0.05; // Start at 5% from top
    const leftColumnX = 0.1; // 10% from left
    const rightColumnX = 0.55; // 55% from left
    const fieldHeight = 0.04; // 4% of page height
    const fieldWidth = 0.35; // 35% of page width
    const verticalGap = 0.015; // 1.5% gap between fields
    const pageHeight = 0.95; // Use 95% of page height
    let fieldIndex = 0;

    while ((match = tagRegex.exec(text)) !== null) {
      const fullTag = match[1].trim();
      const parts = fullTag.split(';');
      const tagName = parts[0].trim();

      // Skip if already processed
      if (processedTags.has(tagName)) {
        continue;
      }
      processedTags.add(tagName);

      // Parse attributes from tag (e.g., {{name;type=signature;role=Client}})
      const attributes: Record<string, string> = {};
      for (let i = 1; i < parts.length; i++) {
        const [key, value] = parts[i].split('=').map((s) => s.trim());
        if (key && value) {
          attributes[key] = value;
        }
      }

      // Infer field type and role
      const type = (attributes.type as any) || inferFieldType(tagName);
      const role = attributes.role || inferRole(tagName);

      // Create display name
      const displayName = tagName
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      // Adjust dimensions based on field type
      let height = fieldHeight;
      let width = fieldWidth;

      if (type === 'signature' || type === 'initials') {
        height = 0.08;
      } else if (type === 'checkbox') {
        height = 0.03;
        width = 0.03;
      } else if (type === 'image') {
        height = 0.12;
      }

      // Alternate between left and right columns
      const useLeftColumn = fieldIndex % 2 === 0;
      const x = useLeftColumn ? leftColumnX : rightColumnX;

      // Move to next row after both columns are filled
      if (!useLeftColumn && fieldIndex > 0) {
        currentY += height + verticalGap;
      }

      // Check if we need a new page
      if (currentY + height > pageHeight) {
        currentPage += 1;
        currentY = 0.05;
      }

      fields.push({
        id: uuidv4(),
        originalTag: match[0],
        name: tagName,
        displayName,
        type,
        role,
        required: attributes.required !== 'false',
        readonly: attributes.readonly === 'true',
        defaultValue: attributes.default_value,
        placeholder: attributes.placeholder,
        areas: [
          {
            x,
            y: currentY,
            w: width,
            h: height,
            page: Math.min(currentPage, pageCount), // DocuSeal uses 1-indexed pages
          },
        ],
      });

      fieldIndex++;
    }

    console.log('Total fields extracted:', fields.length);

    return { fields, pageCount, extractedText: text };
  } catch (error) {
    console.error('Error extracting tags from PDF:', error);
    throw error;
  }
}

/**
 * Get text content from PDF for tag extraction
 */
export async function getPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;

    let text = '';
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
    }

    return text;
  } catch (error) {
    console.error('Error getting PDF text:', error);
    throw error;
  }
}

/**
 * IMPORTANT NOTE:
 *
 * This implementation extracts {{tags}} from PDF files using pdfjs-dist for text extraction.
 * The coordinates returned are for preview/validation purposes only.
 *
 * HYBRID APPROACH:
 * - {{tags}} in document: Used by DocuSeal for field positioning
 * - Fields array (no coordinates): Used by DocuSeal for role/type metadata
 * - Tags are automatically removed from the final document (remove_tags: true)
 *
 * Benefits:
 * - Users can use simple tags like {{client_name}}
 * - App infers roles and types from tag names
 * - DocuSeal positions fields exactly where tags appear
 * - Roles are correctly assigned even if not in tags
 */

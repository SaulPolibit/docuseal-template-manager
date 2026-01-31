/**
 * DOCX Processing Utilities
 * Helper functions for processing DOCX files and extracting tag coordinates
 */

import { ExtractedField } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { inferFieldType, inferRole } from './infer-types';
import mammoth from 'mammoth';

/**
 * Extract text content and tag positions from DOCX
 * Note: This uses a simplified approach with grid-based positioning
 * DOCX files don't preserve exact visual layout, so we use grid positioning
 */
export async function extractTagsFromDOCX(buffer: Buffer): Promise<{
  fields: ExtractedField[];
  extractedText?: string;
}> {
  try {
    // Extract text from DOCX using mammoth
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    console.log('DOCX Parse Result:');
    console.log('- Text length:', text.length);
    console.log('- Text preview:', text.substring(0, 500));

    const fields: ExtractedField[] = [];
    const processedTags = new Set<string>();

    // Find all {{tag}} patterns in the text
    const tagRegex = /\{\{([^}]+)\}\}/g;
    const matches = text.match(tagRegex);
    console.log('- Tags found:', matches);

    let match;

    // Use grid-based positioning since DOCX doesn't provide exact coordinates
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

      // Check if we need a new page (estimate ~25 fields per page)
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
            page: currentPage, // DocuSeal uses 1-indexed pages
          },
        ],
      });

      fieldIndex++;
    }

    console.log('Total fields extracted from DOCX:', fields.length);

    return { fields, extractedText: text };
  } catch (error) {
    console.error('Error extracting tags from DOCX:', error);
    throw error;
  }
}

/**
 * Get text content from DOCX for tag extraction
 */
export async function getDOCXText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error getting DOCX text:', error);
    throw error;
  }
}

/**
 * IMPORTANT NOTE:
 *
 * This implementation extracts {{tags}} from DOCX files using mammoth for text extraction.
 * The coordinates returned are for preview/validation purposes only.
 *
 * HYBRID APPROACH:
 * - {{tags}} in document: Used by DocuSeal for field positioning
 * - Fields array (no coordinates): Used by DocuSeal for role/type metadata
 * - Tags are automatically removed from the final document (remove_tags: true)
 * - DocuSeal converts DOCX to PDF and positions fields based on tag locations
 *
 * Benefits:
 * - Users can use simple tags like {{client_name}}
 * - App infers roles and types from tag names
 * - DocuSeal positions fields exactly where tags appear
 * - Roles are correctly assigned even if not in tags
 * - Works consistently for both DOCX and PDF files
 */

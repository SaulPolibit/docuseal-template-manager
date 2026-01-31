import { v4 as uuidv4 } from 'uuid';
import { ExtractedField, FieldType } from '@/types';
import { inferFieldType, inferRole } from './infer-types';

/**
 * Extracts tags from DOCX text content
 * Supports tags with attributes: {{tag_name;type=signature;role=Client}}
 */
export function extractTags(text: string): ExtractedField[] {
  // Regular expression to match {{tag_name}} or {{tag_name;attr=value;attr2=value2}}
  const tagRegex = /\{\{([^}]+)\}\}/g;
  const matches = Array.from(text.matchAll(tagRegex));

  if (matches.length === 0) {
    return [];
  }

  // Use a Map to track unique tag names and avoid duplicates
  const uniqueTags = new Map<string, ExtractedField>();

  matches.forEach((match) => {
    const fullTag = match[1].trim();
    const parts = fullTag.split(';');
    const tagName = parts[0].trim();

    // Skip if we've already processed this tag name
    if (uniqueTags.has(tagName)) {
      return;
    }

    // Parse attributes (e.g., type=signature, role=Client)
    const attributes: Record<string, string> = {};
    for (let i = 1; i < parts.length; i++) {
      const [key, value] = parts[i].split('=').map((s) => s.trim());
      if (key && value) {
        attributes[key] = value;
      }
    }

    // Infer type from attributes or tag name
    const type: FieldType = (attributes.type as FieldType) || inferFieldType(tagName);

    // Infer role from attributes or tag name
    const role: string = attributes.role || inferRole(tagName);

    // Create display name (convert snake_case to Title Case)
    const displayName = tagName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Create the field object
    const field: ExtractedField = {
      id: uuidv4(),
      originalTag: `{{${match[1]}}}`,
      name: tagName,
      displayName,
      type,
      role,
      required: attributes.required !== 'false', // Default to true unless explicitly set to false
      readonly: attributes.readonly === 'true', // Default to false unless explicitly set to true
      defaultValue: attributes.default_value,
      placeholder: attributes.placeholder,
      areas: [], // Will be populated by coordinate extraction
    };

    uniqueTags.set(tagName, field);
  });

  return Array.from(uniqueTags.values());
}

/**
 * Validates file type
 */
export function validateFileType(file: File): boolean {
  const allowedType = 'application/pdf';
  return file.type === allowedType;
}

/**
 * Validates file size
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Converts file to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/...;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Sanitizes field name (alphanumeric + underscore only)
 */
export function sanitizeFieldName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Extracts text from PDF using pdf.js
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const { getPdfText } = await import('./pdf-processor');
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return getPdfText(buffer);
}

/**
 * Main function to process PDF file and extract tags
 */
export async function processPdfFile(file: File): Promise<ExtractedField[]> {
  // Validate file type
  if (!validateFileType(file)) {
    throw new Error('INVALID_FILE_TYPE');
  }

  // Validate file size
  if (!validateFileSize(file)) {
    throw new Error('FILE_TOO_LARGE');
  }

  // Extract text from PDF
  const text = await extractTextFromPdf(file);

  // Extract tags from text
  const fields = extractTags(text);

  if (fields.length === 0) {
    throw new Error('NO_TAGS_FOUND');
  }

  return fields;
}

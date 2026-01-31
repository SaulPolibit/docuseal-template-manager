import { FieldType, FIELD_TYPE_INFERENCE, ROLE_INFERENCE } from '@/types';

/**
 * Infers field type from tag name using pattern matching
 * @param tagName - The tag name to analyze (e.g., "provider_signature")
 * @returns The inferred field type
 */
export function inferFieldType(tagName: string): FieldType {
  const lowerName = tagName.toLowerCase();

  // Check each field type's patterns
  for (const [fieldType, patterns] of Object.entries(FIELD_TYPE_INFERENCE)) {
    for (const pattern of patterns) {
      if (lowerName.includes(pattern.toLowerCase())) {
        return fieldType as FieldType;
      }
    }
  }

  // Default to 'text' if no pattern matches
  return 'text';
}

/**
 * Infers role from tag name using pattern matching
 * @param tagName - The tag name to analyze (e.g., "provider_signature")
 * @returns The inferred role name
 */
export function inferRole(tagName: string): string {
  const lowerName = tagName.toLowerCase();

  // Check each role's patterns
  for (const [roleName, patterns] of Object.entries(ROLE_INFERENCE)) {
    for (const pattern of patterns) {
      if (lowerName.includes(pattern.toLowerCase())) {
        return roleName;
      }
    }
  }

  // Default to 'First Party' if no pattern matches
  return 'First Party';
}

/**
 * Gets a list of all available field types
 */
export function getAvailableFieldTypes(): FieldType[] {
  return [
    'text',
    'signature',
    'initials',
    'date',
    'checkbox',
    'image',
    'file',
    'phone',
    'number',
    'select',
    'radio',
    'stamp',
  ];
}

/**
 * Gets a list of all available roles
 */
export function getAvailableRoles(): string[] {
  return ['First Party', 'Second Party', 'Service Provider', 'Client'];
}

/**
 * Validates if a field type is valid
 */
export function isValidFieldType(type: string): type is FieldType {
  return getAvailableFieldTypes().includes(type as FieldType);
}

/**
 * Gets a human-readable description for a field type
 */
export function getFieldTypeDescription(type: FieldType): string {
  const descriptions: Record<FieldType, string> = {
    text: 'Single-line text input',
    signature: 'Electronic signature',
    initials: 'Initials field',
    date: 'Date picker',
    checkbox: 'Checkbox (true/false)',
    image: 'Image upload',
    file: 'File attachment',
    phone: 'Phone number',
    number: 'Numeric input',
    select: 'Dropdown selection',
    radio: 'Radio button group',
    stamp: 'Date/time stamp',
  };

  return descriptions[type] || 'Unknown field type';
}

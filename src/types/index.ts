// Field Types
export type FieldType =
  | 'text'
  | 'signature'
  | 'initials'
  | 'date'
  | 'checkbox'
  | 'image'
  | 'file'
  | 'phone'
  | 'number'
  | 'select'
  | 'radio'
  | 'stamp';

// Field Area (coordinates on document)
export interface FieldArea {
  x: number; // 0-1 (percentage of page width)
  y: number; // 0-1 (percentage of page height)
  w: number; // 0-1 (percentage of page width)
  h: number; // 0-1 (percentage of page height)
  page: number; // 1-indexed page number
}

// Field Validation
export interface FieldValidation {
  pattern?: string; // Regex pattern
  min?: number | string; // Min value/date
  max?: number | string; // Max value/date
}

// Field Preferences
export interface FieldPreferences {
  fontSize?: number; // 8-24
  fontType?: 'normal' | 'bold' | 'italic';
  align?: 'left' | 'center' | 'right';
  color?: 'black' | 'blue' | 'red';
}

// Extracted Field
export interface ExtractedField {
  id: string; // Unique identifier (uuid)
  originalTag: string; // e.g., "{{provider_signature}}"
  name: string; // e.g., "provider_signature"
  displayName: string; // e.g., "Provider Signature"
  type: FieldType; // signature | text | date | checkbox | etc.
  role: string; // e.g., "Service Provider"
  required: boolean; // Default: true
  readonly?: boolean; // For pre-filled fields
  defaultValue?: string; // For pre-filling
  placeholder?: string; // Hint text
  validation?: FieldValidation;
  preferences?: FieldPreferences;
  areas: FieldArea[]; // Coordinates on document
}

// Template Status
export type TemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// Template
export interface Template {
  id: string;
  name: string;
  docusealId?: number; // DocuSeal template ID after creation
  externalId?: string;
  documentName: string;
  documentHash?: string; // MD5 hash to detect changes
  fields: ExtractedField[];
  status: TemplateStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Submission Status
export type SubmissionStatus = 'PENDING' | 'SENT' | 'COMPLETED' | 'DECLINED' | 'EXPIRED';

// Submitter
export interface Submitter {
  role: string;
  email: string;
  name?: string;
  phone?: string;
  values?: Record<string, any>; // Pre-filled values
  fields?: SubmitterFieldConfig[];
}

export interface SubmitterFieldConfig {
  name: string;
  readonly?: boolean;
  default_value?: string;
}

// Submission
export interface Submission {
  id: string;
  templateId: string;
  docusealId?: number; // DocuSeal submission ID
  status: SubmissionStatus;
  submitters: Submitter[];
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Upload Validation
export interface UploadValidation {
  allowedTypes: string[];
  maxSizeBytes: number; // 10MB
  maxSizeMB: number;
}

// Extract Coordinates Response
export interface ExtractCoordinatesResponse {
  success: boolean;
  fields: ExtractedField[];
  pageCount: number;
  pdfPreviewUrl?: string; // Temporary URL for preview
  fileType?: 'pdf' | 'docx'; // File type indicator
  error?: string;
}

// DocuSeal API Payloads
export interface DocuSealField {
  name: string;
  type: FieldType;
  role: string;
  required?: boolean;
  readonly?: boolean;
  default_value?: string;
  areas?: { // Optional: omit when using tags for positioning
    x: number;
    y: number;
    w: number;
    h: number;
    page: number;
  }[];
}

export interface CreateTemplatePayload {
  name: string;
  external_id?: string; // Your internal reference
  folder_name?: string;
  documents: {
    name: string;
    file: string; // Base64 encoded PDF or DOCX
    fields?: DocuSealField[]; // Optional: use tags in document instead
    remove_tags?: boolean; // Remove {{tags}} from document (default: true)
  }[];
}

export interface CreateSubmissionPayload {
  template_id: number;
  send_email?: boolean; // Default: true
  send_sms?: boolean; // Default: false
  order?: 'preserved' | 'random';
  submitters: Submitter[];
  message?: {
    subject?: string;
    body?: string;
  };
}

// API Error
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'Please upload a valid PDF or DOCX file',
  FILE_TOO_LARGE: 'File size must be less than 10MB',
  CONVERSION_FAILED: 'Failed to process document. Please try again.',
  NO_TAGS_FOUND:
    'No {{tags}} found in document. Add placeholders like {{signature}} to your document.',
  API_ERROR: 'DocuSeal API error. Please check your API key.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};

// Field Type Inference Patterns
export const FIELD_TYPE_INFERENCE: Record<FieldType, string[]> = {
  signature: ['_signature', 'signature', '_sign'],
  initials: ['_initials', 'initials'],
  date: ['_date', 'date'],
  image: ['_image', 'image', 'photo', 'attachment', 'logo'],
  checkbox: ['checkbox', 'check_', '_agree', '_confirm'],
  phone: ['phone', 'telephone', 'mobile', 'cell'],
  number: ['_amount', 'amount', 'total_', 'price', 'cost', 'qty'],
  text: [], // Default fallback
  file: ['_file', 'file', 'attachment'],
  select: ['_select', 'select', 'dropdown'],
  radio: ['_radio', 'radio', 'option'],
  stamp: ['_stamp', 'stamp'],
};

// Role Inference Patterns
export const ROLE_INFERENCE: Record<string, string[]> = {
  'Service Provider': ['provider_', 'provider', 'vendor_', 'seller_'],
  Client: ['client_', 'client', 'customer_', 'buyer_', 'tenant_'],
  'First Party': [], // Default fallback
};

// Role Colors
export const ROLE_COLORS: Record<string, string> = {
  'Service Provider': '#3B82F6', // Blue
  Client: '#10B981', // Green
  'First Party': '#F59E0B', // Amber
  'Second Party': '#8B5CF6', // Purple
};

// Type Indicators
export const TYPE_INDICATORS: Record<string, { icon: string; style: string }> = {
  signature: { icon: 'pen-tool', style: 'dashed' },
  text: { icon: 'type', style: 'solid' },
  date: { icon: 'calendar', style: 'solid' },
  checkbox: { icon: 'check-square', style: 'dotted' },
  initials: { icon: 'edit-3', style: 'dashed' },
  image: { icon: 'image', style: 'solid' },
  phone: { icon: 'phone', style: 'solid' },
  number: { icon: 'hash', style: 'solid' },
};

import axios, { AxiosInstance } from 'axios';
import {
  CreateTemplatePayload,
  CreateSubmissionPayload,
  ApiError,
  ExtractedField,
  DocuSealField,
} from '@/types';

/**
 * DocuSeal API Client
 * Handles all API calls to the DocuSeal service
 */
class DocuSealClient {
  private client: AxiosInstance;

  constructor(apiKey: string, apiUrl: string = 'https://api.docuseal.com') {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Convert ExtractedField to DocuSealField format
   * @param includeAreas - If false, only includes metadata (for tag-based positioning)
   */
  private convertToDocuSealField(field: ExtractedField, includeAreas: boolean = true): DocuSealField {
    const docuSealField: any = {
      name: field.name,
      type: field.type,
      role: field.role,
      required: field.required,
      readonly: field.readonly,
      default_value: field.defaultValue,
    };

    // Only include areas if explicitly requested (for coordinate-based positioning)
    // When using tags, we skip areas to let DocuSeal position based on tag location
    if (includeAreas && field.areas && field.areas.length > 0) {
      docuSealField.areas = field.areas.map((area) => ({
        x: area.x,
        y: area.y,
        w: area.w,
        h: area.h,
        page: area.page,
      }));
    }

    return docuSealField as DocuSealField;
  }

  /**
   * Create a new template from PDF or DOCX
   * Uses a hybrid approach: tags in document for positioning + fields array for roles
   * @param fileType - 'pdf' or 'docx' to determine which endpoint to use
   */
  async createTemplate(
    name: string,
    documentName: string,
    documentBase64: string,
    fields: ExtractedField[],
    options?: {
      externalId?: string;
      folderName?: string;
      fileType?: 'pdf' | 'docx';
    }
  ) {
    try {
      const payload: CreateTemplatePayload = {
        name,
        external_id: options?.externalId,
        folder_name: options?.folderName,
        documents: [
          {
            name: documentName,
            file: documentBase64,
            // Send fields array with inferred roles and types (NO coordinates)
            // DocuSeal will use {{tags}} in document for positioning
            // and fields array for role/type metadata
            fields: fields.map((field) => this.convertToDocuSealField(field, false)),
            // Remove tags from the final document
            remove_tags: true,
          },
        ],
      };

      // Use the appropriate endpoint based on file type
      const fileType = options?.fileType || 'pdf';
      const endpoint = `/templates/${fileType}`;

      const response = await this.client.post(endpoint, payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all templates
   */
  async getTemplates() {
    try {
      const response = await this.client.get('/templates');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific template
   */
  async getTemplate(id: number) {
    try {
      const response = await this.client.get(`/templates/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a template
   */
  async updateTemplate(id: number, updates: Partial<CreateTemplatePayload>) {
    try {
      const response = await this.client.put(`/templates/${id}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Archive a template
   */
  async archiveTemplate(id: number) {
    try {
      const response = await this.client.delete(`/templates/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a submission (send for signing)
   */
  async createSubmission(payload: CreateSubmissionPayload) {
    try {
      const response = await this.client.post('/submissions', payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all submissions
   */
  async getSubmissions(templateId?: number) {
    try {
      const params = templateId ? { template_id: templateId } : {};
      const response = await this.client.get('/submissions', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific submission
   */
  async getSubmission(id: number) {
    try {
      const response = await this.client.get(`/submissions/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      return {
        code: status ? `HTTP_${status}` : 'NETWORK_ERROR',
        message,
        details: error.response?.data,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
    };
  }
}

/**
 * Server-side only: Create DocuSeal client instance
 * This should only be used in API routes
 */
export function createDocuSealClient(): DocuSealClient {
  const apiKey = process.env.DOCUSEAL_API_KEY;
  const apiUrl = process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com';

  if (!apiKey) {
    throw new Error('DOCUSEAL_API_KEY environment variable is not set');
  }

  return new DocuSealClient(apiKey, apiUrl);
}

export { DocuSealClient };

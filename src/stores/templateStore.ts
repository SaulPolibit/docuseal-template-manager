import { create } from 'zustand';
import { Template, ExtractedField, FieldArea } from '@/types';

interface TemplateStore {
  // Current template being edited
  currentTemplate: Template | null;
  fields: ExtractedField[];
  selectedFieldId: string | null;

  // Document state
  documentBase64: string | null;
  documentFile: File | null;
  pdfPreviewUrl: string | null;
  currentPage: number;
  totalPages: number;
  zoom: number;

  // Loading states
  isProcessing: boolean;
  isExtracting: boolean;
  isSaving: boolean;

  // Error state
  error: string | null;

  // Actions
  setTemplate: (template: Template | null) => void;
  setFields: (fields: ExtractedField[]) => void;
  addField: (field: ExtractedField) => void;
  updateField: (id: string, updates: Partial<ExtractedField>) => void;
  deleteField: (id: string) => void;
  selectField: (id: string | null) => void;
  updateFieldPosition: (id: string, areaIndex: number, area: Partial<FieldArea>) => void;
  addFieldArea: (id: string, area: FieldArea) => void;
  removeFieldArea: (id: string, areaIndex: number) => void;

  // Document actions
  setDocumentFile: (file: File | null) => void;
  setDocumentBase64: (base64: string | null) => void;
  setPdfPreviewUrl: (url: string | null) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setZoom: (zoom: number) => void;

  // Loading and error actions
  setIsProcessing: (isProcessing: boolean) => void;
  setIsExtracting: (isExtracting: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;

  // Reset action
  reset: () => void;
}

const initialState = {
  currentTemplate: null,
  fields: [],
  selectedFieldId: null,
  documentBase64: null,
  documentFile: null,
  pdfPreviewUrl: null,
  currentPage: 1,
  totalPages: 0,
  zoom: 1,
  isProcessing: false,
  isExtracting: false,
  isSaving: false,
  error: null,
};

export const useTemplateStore = create<TemplateStore>((set) => ({
  ...initialState,

  setTemplate: (template) => set({ currentTemplate: template }),

  setFields: (fields) => set({ fields }),

  addField: (field) =>
    set((state) => ({
      fields: [...state.fields, field],
    })),

  updateField: (id, updates) =>
    set((state) => ({
      fields: state.fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      ),
    })),

  deleteField: (id) =>
    set((state) => ({
      fields: state.fields.filter((field) => field.id !== id),
      selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
    })),

  selectField: (id) => set({ selectedFieldId: id }),

  updateFieldPosition: (id, areaIndex, areaUpdates) =>
    set((state) => ({
      fields: state.fields.map((field) => {
        if (field.id === id && field.areas[areaIndex]) {
          const updatedAreas = [...field.areas];
          updatedAreas[areaIndex] = { ...updatedAreas[areaIndex], ...areaUpdates };
          return { ...field, areas: updatedAreas };
        }
        return field;
      }),
    })),

  addFieldArea: (id, area) =>
    set((state) => ({
      fields: state.fields.map((field) =>
        field.id === id ? { ...field, areas: [...field.areas, area] } : field
      ),
    })),

  removeFieldArea: (id, areaIndex) =>
    set((state) => ({
      fields: state.fields.map((field) => {
        if (field.id === id) {
          const updatedAreas = field.areas.filter((_, index) => index !== areaIndex);
          return { ...field, areas: updatedAreas };
        }
        return field;
      }),
    })),

  setDocumentFile: (file) => set({ documentFile: file }),

  setDocumentBase64: (base64) => set({ documentBase64: base64 }),

  setPdfPreviewUrl: (url) => set({ pdfPreviewUrl: url }),

  setCurrentPage: (page) => set({ currentPage: page }),

  setTotalPages: (pages) => set({ totalPages: pages }),

  setZoom: (zoom) => set({ zoom }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  setIsExtracting: (isExtracting) => set({ isExtracting }),

  setIsSaving: (isSaving) => set({ isSaving }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

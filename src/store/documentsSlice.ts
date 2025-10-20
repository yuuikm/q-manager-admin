import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { adminAPI } from 'api/admin';
import type { Document, DocumentsResponse, UpdateDocumentData } from 'api/admin';

interface DocumentsState {
  documents: Document[];
  currentDocument: Document | null;
  categories: string[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const initialState: DocumentsState = {
  documents: [],
  currentDocument: null,
  categories: [],
  isLoading: false,
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  },
};

export const uploadDocument = createAsyncThunk(
  'documents/upload',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await adminAPI.uploadDocument(formData);
      return response.document;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Upload failed');
    }
  }
);

export const fetchDocuments = createAsyncThunk(
  'documents/fetchAll',
  async (params: { page?: number; category?: string; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getDocuments(params);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch documents');
    }
  }
);


export const updateDocument = createAsyncThunk(
  'documents/update',
  async ({ id, data }: { id: number; data: UpdateDocumentData }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.updateDocument(id, data);
      return response.document;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Update failed');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await adminAPI.deleteDocument(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Delete failed');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'documents/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const categories = await adminAPI.getCategories();
      return categories;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch categories');
    }
  }
);

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentDocument: (state) => {
      state.currentDocument = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.isLoading = false;
        state.documents.unshift(action.payload);
        state.error = null;
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action: PayloadAction<DocumentsResponse>) => {
        state.isLoading = false;
        state.documents = action.payload.data;
        state.pagination = {
          current_page: action.payload.current_page,
          last_page: action.payload.last_page,
          per_page: action.payload.per_page,
          total: action.payload.total,
        };
        state.error = null;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.isLoading = false;
        const index = state.documents.findIndex(doc => doc.id === action.payload.id);
        if (index !== -1) {
          state.documents[index] = action.payload;
        }
        if (state.currentDocument?.id === action.payload.id) {
          state.currentDocument = action.payload;
        }
        state.error = null;
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action: PayloadAction<number>) => {
        state.isLoading = false;
        state.documents = state.documents.filter(doc => doc.id !== action.payload);
        if (state.currentDocument?.id === action.payload) {
          state.currentDocument = null;
        }
        state.error = null;
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.categories = action.payload;
      });
  },
});

export const { clearError, clearCurrentDocument } = documentsSlice.actions;
export default documentsSlice.reducer;

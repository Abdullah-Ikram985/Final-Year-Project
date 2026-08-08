import { API_ROUTES } from '..';
import { apiClient } from '../client';

export const fileService = {
  pdfUpload: async (formData: FormData) => {
    console.log('[FileService] PDF Upload - FormData received', {
      parts: (formData as any)._parts?.length,
    });

    try {
      // Use longer timeout for file uploads (30s instead of default 10s)
      const response = await apiClient.post(
        API_ROUTES.UPLOAD_PDF_FILE,
        formData,
        {
          timeout: 30000,
        },
      );

      console.log('[FileService] PDF Upload - Success', {
        status: response.status,
        dataSize: JSON.stringify(response.data).length,
      });

      return response.data;
    } catch (error: any) {
      console.error('[FileService] PDF Upload - Error', {
        code: error.code,
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
      });
      throw error;
    }
  },

  imageUpload: async (formData: FormData) => {
    // Use longer timeout for file uploads (30s instead of default 10s)
    const response = await apiClient.post(
      API_ROUTES.UPLOAD_PROFILE_IMAGE,
      formData,
      {
        timeout: 30000,
      },
    );
    return response.data;
  },
};

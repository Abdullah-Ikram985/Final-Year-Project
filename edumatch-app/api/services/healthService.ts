import { API_ROUTES } from '..';
import { apiClient } from '../client';

export const healthService = {
  /**
   * Check if the backend API is reachable
   * @returns true if backend is accessible, false otherwise
   */
  checkConnection: async (): Promise<boolean> => {
    try {
      console.log(
        `[Health Check] Testing connection to: ${API_ROUTES.BASE_URL}`,
      );

      // Try a simple GET request with a short timeout
      const response = await apiClient.get('users/login', {
        timeout: 5000,
        validateStatus: () => true, // Accept any status code
      });

      console.log(`[Health Check] Response status: ${response.status}`);
      return true;
    } catch (error: any) {
      console.error('[Health Check] Failed:', {
        code: error.code,
        message: error.message,
        errno: error.errno,
      });
      return false;
    }
  },

  /**
   * Check if the PDF upload endpoint is reachable
   * @returns true if endpoint is accessible, false otherwise
   */
  checkUploadEndpoint: async (): Promise<boolean> => {
    try {
      console.log(
        `[Upload Check] Testing ${API_ROUTES.UPLOAD_PDF_FILE} endpoint`,
      );

      // Create a minimal test FormData
      const testFormData = new FormData();
      testFormData.append('pdf', new Blob(), 'test.pdf');

      const response = await apiClient.post(
        API_ROUTES.UPLOAD_PDF_FILE,
        testFormData,
        {
          timeout: 5000,
          validateStatus: () => true,
        },
      );

      console.log(`[Upload Check] Response status: ${response.status}`);
      return true;
    } catch (error: any) {
      console.error('[Upload Check] Failed:', {
        code: error.code,
        message: error.message,
        errno: error.errno,
      });
      return false;
    }
  },
};

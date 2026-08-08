import { API_ROUTES } from '..';
import { apiClient } from '../client';

export const savedJobServices = {
  saveJob: async (jobId: string) => {
    const response = await apiClient.post(`${API_ROUTES.SAVED_JOBS}/${jobId}`);
    return response.data;
  },

  unsaveJob: async (jobId: string) => {
    const response = await apiClient.delete(
      `${API_ROUTES.UNSAVED_JOBS}/${jobId}`,
    );
    return response.data;
  },

  getSavedJobs: async () => {
    const response = await apiClient.get(`${API_ROUTES.GET_SAVED_JOBS}`);
    return response.data;
  },
};

export const candidateViewServices = {
  incrementProfileView: async (candidateId: string) => {
    const response = await apiClient.post(
      `${API_ROUTES.CANDIDATE_PROFILE_VIEW}/${candidateId}/view`,
    );
    return response.data;
  },
};

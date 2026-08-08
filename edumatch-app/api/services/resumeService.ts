import { API_ROUTES } from '..';
import { apiClient } from '../client';

export const resumeService = {
  getResumeData: async () => {
    const response = await apiClient.get(API_ROUTES.RESUME_GET);
    return response.data;
  },
  getCareerRoadmap: async () => {
    const response = await apiClient.get(API_ROUTES.CAREER_ROADMAP_GET);
    return response.data;
  },
};

export default resumeService;

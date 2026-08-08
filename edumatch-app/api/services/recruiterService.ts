import { API_ROUTES } from '..';
import { apiClient } from '../client';

export const recruiterServices = {
  getRecruiterProfile: async () => {
    const response = await apiClient.get(`${API_ROUTES.GET_RECRUITER_PROFILE}`);
    return response.data;
  },

  updateRecruiterProfile: async (profileData: {
    name?: string;
    companyName?: string;
    companyWebsite?: string;
    companySize?: string;
    industry?: string;
    designation?: string;
    phoneNumber?: string;
    location?: string;
    linkedinProfileLink?: string;
    professionalBio?: string;
    companyLogoUrl?: string;
  }) => {
    const response = await apiClient.patch(
      API_ROUTES.UPDATE_RECRUITER_PROFILE,
      profileData,
    );
    return response.data;
  },
};

export const allRecruiterCandidatesService = {
  getCandidates: async () => {
    const response = await apiClient.get(API_ROUTES.ALL_RECRUITER_CANDIDATES);
    return response.data;
  },
};

export const recruiterDashboardService = {
  getStats: async () => {
    const response = await apiClient.get(API_ROUTES.RECRUITER_DASHBOARD_STATS);
    return response.data;
  },
};

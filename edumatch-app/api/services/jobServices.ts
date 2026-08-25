import { API_ROUTES } from '..';
import { apiClient } from '../client';

export const jobService = {
  createJob: async (jobData: {
    title: string;
    department: string;
    location: string;
    salary: string;
    jobType: string;
    skills: string[];
    description: string;
  }) => {
    const response = await apiClient.post(API_ROUTES.CREATE_JOB, jobData);
    return response.data;
  },
};
export const recruiterJobService = {
  getRecruiterJobs: async () => {
    const response = await apiClient.get(API_ROUTES.GET_RECREUITER_JOBS);
    return response.data;
  },
};
export const recommendedJobs = {
  candidateRecommendedJobs: async () => {
    const response = await apiClient.get(API_ROUTES.RECOMMENDED_JOBS);
    return response.data;
  },
};

// All jobs currently saved in the backend (posted by recruiters),
// regardless of AI match score — used for the general "Browse Jobs" list.
export const allJobsService = {
  getAllJobs: async () => {
    const response = await apiClient.get(API_ROUTES.ALL_JOBS);
    return response.data;
  },
};

export const updatingJobStatus = {
  updateJobStatus: async (jobId: string, jobStatus: string) => {
    const response = await apiClient.patch(
      `${API_ROUTES.UPDATE_JOB_STATUS}/${jobId}`,
      { jobStatus },
    );
    return response.data;
  },
};

export const jobDetailServices = {
  jobDetail: async (jobId: string) => {
    const response = await apiClient.get(
      `${API_ROUTES.GET_JOB_DETAIL}/${jobId}`,
    );
    return response.data;
  },
};
export const deleteJob = {
  delete: async (jobId: string) => {
    const response = await apiClient.delete(
      `${API_ROUTES.DELETE_JOB}/${jobId}`,
    );
    return response.data;
  },
};

export const applyToJobService = {
  applyToJob: async (jobId: string) => {
    const response = await apiClient.post(
      `${API_ROUTES.APPLY_TO_JOB}/${jobId}`,
    );
    return response.data;
  },
};

export const candidateJobService = {
  getAppliedJobs: async () => {
    const response = await apiClient.get(API_ROUTES.CANDIDATE_APPLIED_JOBS);
    return response.data;
  },
};

export const applicationStatusService = {
  checkStatus: async (jobId: string) => {
    const response = await apiClient.get(
      `${API_ROUTES.CHECK_JOB_APPLICATION_STATUS}/${jobId}`,
    );
    return response.data;
  },
};

export const jobApplicantsService = {
  getApplicants: async (jobId: string) => {
    const response = await apiClient.get(
      `${API_ROUTES.JOB_APPLICANTS}/${jobId}`,
    );
    return response.data;
  },
};

export const updateApplicantStatusService = {
  updateStatus: async (
    jobId: string,
    candidateProfileId: string,
    status: string,
  ) => {
    const response = await apiClient.patch(
      `jobs/updateApplicantsJobStatus/${jobId}/applicants/${candidateProfileId}`,
      { status },
    );
    return response.data;
  },
};

export const notificationService = {
  getNotifications: async () => {
    const response = await apiClient.get(API_ROUTES.NOTIFICATIONS);
    return response.data;
  },
  markAsRead: async (notificationId: string) => {
    const response = await apiClient.patch(
      `${API_ROUTES.NOTIFICATIONS}/${notificationId}/read`,
    );
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await apiClient.patch(
      API_ROUTES.MARK_ALL_NOTIFICATIONS_READ,
    );
    return response.data;
  },
  deleteNotification: async (notificationId: string) => {
    const response = await apiClient.delete(
      `${API_ROUTES.NOTIFICATIONS}/${notificationId}`,
    );
    return response.data;
  },
};
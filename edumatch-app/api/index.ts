export const BASE_URL = 'http://192.168.1.12:8000';
export const API_VERSION = '/api/v1/';

export const API_ROUTES = {
  BASE_URL,
  API_VERSION,
  LOGIN: 'users/login',
  SIGNUP: 'users/signup',
  GET_ME: 'users/me',

  UPLOAD_PDF_FILE: 'files/uploadPDF',
  UPLOAD_PROFILE_IMAGE: 'files/uploadImage',

  RESUME_GET: 'resume/getResumeData',
  CAREER_ROADMAP_GET: 'resume/getCareerRoadmap',

  UPDATE_PROFILE: 'users/updateUser',

  FORGOTPASSWORD: 'users/forgotPassword',
  RESETPASSWORD: 'users/resetPassword/:token',

  CREATE_JOB: 'jobs/create',
  GET_RECREUITER_JOBS: 'jobs/myJobs',
  UPDATE_JOB_STATUS: 'jobs/updateJobStatus',
  DELETE_JOB: 'jobs/deleteJobById',
  RECOMMENDED_JOBS: 'jobs/recommendedJobs',
  GET_JOB_DETAIL: 'jobs/jobDetail',
  APPLY_TO_JOB: 'jobs/applyToJob',
  JOB_APPLICANTS: 'jobs/applicants',
  UPDATE_APPLICANTS_JOB_STATUS:
    'jobs/updateApplicantsJobStatus/:jobId/applicants/:candidateProfileId',
  CANDIDATE_APPLIED_JOBS: 'jobs/candiadteAppliedJobs',
  CHECK_JOB_APPLICATION_STATUS: 'jobs/application-status',
  RECRUITER_DASHBOARD_STATS: 'jobs/dashboardStats',
  ALL_RECRUITER_CANDIDATES: 'jobs/allRecruiterCandidates',
  CANDIDATE_PROFILE_VIEW: 'candidate',

  GET_RECRUITER_PROFILE: 'recruiter/profile',
  UPDATE_RECRUITER_PROFILE: 'recruiter/profile',

  SAVED_JOBS: 'candidate/saved-jobs',
  UNSAVED_JOBS: 'candidate/unsaved-jobs',
  GET_SAVED_JOBS: 'candidate/saved-jobs',
};

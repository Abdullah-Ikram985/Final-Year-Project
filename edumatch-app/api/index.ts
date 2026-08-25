import Constants from 'expo-constants';

// Backend server port (change this if your backend runs on a different port)
const BACKEND_PORT = 8000;

// Used only if auto-detection fails (e.g. production build) — update this
// as a last-resort fallback, but in normal Expo Go dev usage it won't be needed.
const FALLBACK_IP = '192.168.1.19';

/**
 * Auto-detects the dev machine's current LAN IP from the Expo dev server's
 * manifest. When you scan the QR code / open Expo Go, Expo already knows
 * the exact IP your PC is reachable at on the network — this reads that
 * value instead of relying on a hardcoded IP that breaks every time your
 * PC's IP changes (e.g. after reconnecting to WiFi).
 */
function getDevServerHost(): string | null {
  const hostUri =
    // Expo SDK 49+ (managed workflow, dev client / Expo Go)
    Constants.expoConfig?.hostUri ??
    // Fallbacks for older/alternate manifest shapes
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any)?.manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') return null;

  // hostUri looks like "192.168.1.19:8081" — we only need the host part
  const host = hostUri.split(':')[0]?.trim();
  return host || null;
}

const detectedHost = getDevServerHost();

export const BASE_URL = `http://${detectedHost ?? FALLBACK_IP}:${BACKEND_PORT}`;
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
  ALL_JOBS: 'jobs/allJobs',
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

  NOTIFICATIONS: 'notifications',
  MARK_ALL_NOTIFICATIONS_READ: 'notifications/mark-all-read',

  MOCK_INTERVIEW_START: 'mock-interviews/start',
  MOCK_INTERVIEW_BASE: 'mock-interviews',
};
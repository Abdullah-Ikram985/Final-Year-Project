import { API_ROUTES } from '..';
import { apiClient } from '../client';

export interface InterviewQuestion {
  questionId: string;
  question: string;
  questionType?: string;
}

export interface QuestionFeedback {
  strengths: string[];
  improvements: string[];
  relevance?: number;
  technicalCorrectness?: number;
  completeness?: number;
  clarity?: number;
}

export interface AnswerResponse {
  questionId: string;
  score: number;
  feedback: QuestionFeedback;
  answeredCount: number;
  totalQuestions: number;
}

export interface ReadinessBreakdown {
  technicalKnowledge: number;
  communication: number;
  jobRelevance: number;
  answerQuality: number;
}

export interface CompleteInterviewResponse {
  interviewId: string;
  jobTitle?: string;
  readinessScore: number;
  breakdown: ReadinessBreakdown;
  strengths: string[];
  areasToImprove: string[];
  recommendation: string;
  completedAt?: string;
}

export interface RecruiterAnswerEntry {
  questionId: string;
  question: string;
  answer: string;
  score?: number;
  relevance?: number;
  technicalCorrectness?: number;
  completeness?: number;
  clarity?: number;
  strengths?: string[];
  improvements?: string[];
}

export interface RecruiterInterviewReport {
  completed: boolean;
  overallReadinessScore?: number;
  breakdown?: ReadinessBreakdown;
  strengths?: string[];
  areasToImprove?: string[];
  recommendation?: string;
  answers?: RecruiterAnswerEntry[];
  completedAt?: string;
}

export const mockInterviewService = {
  startInterview: async (jobId: string) => {
    const response = await apiClient.post(API_ROUTES.MOCK_INTERVIEW_START, {
      jobId,
    });
    return response.data;
  },

  submitAnswer: async (
    interviewId: string,
    questionId: string,
    answer: string,
  ) => {
    const response = await apiClient.post(
      `${API_ROUTES.MOCK_INTERVIEW_BASE}/${interviewId}/answer`,
      { questionId, answer },
    );
    return response.data;
  },

  completeInterview: async (interviewId: string) => {
    const response = await apiClient.post(
      `${API_ROUTES.MOCK_INTERVIEW_BASE}/${interviewId}/complete`,
    );
    return response.data;
  },

  getInterview: async (interviewId: string) => {
    const response = await apiClient.get(
      `${API_ROUTES.MOCK_INTERVIEW_BASE}/${interviewId}`,
    );
    return response.data;
  },

  getRecruiterCandidateInterview: async (
    candidateId: string,
    jobId: string,
  ): Promise<{ status: string; data: RecruiterInterviewReport }> => {
    const response = await apiClient.get(
      `${API_ROUTES.MOCK_INTERVIEW_BASE}/recruiter/${candidateId}/${jobId}`,
    );
    return response.data;
  },
};

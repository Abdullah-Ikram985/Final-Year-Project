const express = require('express');
const authController = require('../controller/authController');
const mockInterviewController = require('../controller/mockInterviewController');

const router = express.Router();

router.use(authController.protect);

// Admin endpoint to view platform-wide AI mock interview analytics
router.get(
  '/admin/analytics',
  authController.restrictTo('admin'),
  mockInterviewController.getAdminInterviewAnalytics,
);

// Recruiter endpoint to view candidate's completed mock interview report
router.get(
  '/recruiter/:candidateId/:jobId',
  authController.restrictTo('recruiter'),
  mockInterviewController.getRecruiterCandidateInterview,
);

// Require candidate authentication for candidate mock interview session endpoints
router.post(
  '/start',
  authController.restrictTo('candidate'),
  mockInterviewController.startMockInterview,
);
router.post(
  '/:interviewId/answer',
  authController.restrictTo('candidate'),
  mockInterviewController.submitAnswer,
);
router.post(
  '/:interviewId/complete',
  authController.restrictTo('candidate'),
  mockInterviewController.completeMockInterview,
);
router.get(
  '/:interviewId',
  authController.restrictTo('candidate'),
  mockInterviewController.getInterviewDetail,
);

module.exports = router;

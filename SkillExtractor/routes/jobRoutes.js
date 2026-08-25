const express = require('express');
const jobController = require('../controller/jobController');
const authController = require('../controller/authController');

const router = express.Router();

// Post new job
router.post(
  '/create',
  authController.protect,
  authController.restrictTo('recruiter'),
  jobController.createJob,
);

// Get all jobs of a recruiter
router.get(
  '/myJobs',
  authController.protect,
  authController.restrictTo('recruiter'),
  jobController.getAllJobsOfRecruiter,
);

// Update job status
router.patch(
  '/updateJobStatus/:jobId',
  authController.protect,
  authController.restrictTo('recruiter'),
  jobController.updateJobStatus,
);
// Get job by ID
router.get('/getJobById/:id', jobController.getJobById);

// ─── Public / Candidate Routes ────────────────────────────────────────────
// IMPORTANT: /recommended must be defined BEFORE /:id
// otherwise Express will treat "recommended" as a MongoDB ObjectId param
router.get(
  '/recommendedJobs',
  authController.protect,
  authController.restrictTo('candidate'),
  jobController.getRecommendedJobs,
);

// ─── Admin Review & Approval Routes ───────────────────────────────────────
router.get(
  '/admin/pending',
  authController.protect,
  authController.restrictTo('admin'),
  jobController.getPendingJobs,
);

router.get(
  '/admin/all',
  authController.protect,
  authController.restrictTo('admin'),
  jobController.getAdminJobs,
);

router.patch(
  '/admin/approve/:jobId',
  authController.protect,
  authController.restrictTo('admin'),
  jobController.approveJob,
);

router.patch(
  '/admin/reject/:jobId',
  authController.protect,
  authController.restrictTo('admin'),
  jobController.rejectJob,
);

// ─── Admin Utility ────────────────────────────────────────────────────────
// Run once to generate embeddings for all jobs created before this feature
router.post(
  '/backfill-embeddings',
  authController.protect,
  authController.restrictTo('recruiter'),
  jobController.backfillJobEmbeddings,
);
// Get all jobs
router.get('/allJobs', jobController.getAllJobs);

// GET JOB DETAIL
router.get(
  '/jobDetail/:jobId',
  authController.protect,
  jobController.jobDetail,
);

router.post(
  '/applyToJob/:jobId',
  authController.protect,
  authController.restrictTo('candidate'),
  jobController.applyToJob,
);
// Delete job by ID — allow recruiter and admin
router.delete(
  '/deleteJobById/:id',
  authController.protect,
  authController.restrictTo('recruiter', 'admin'),
  jobController.deleteJobById,
);

// Recruiter views applicants
router.get(
  '/applicants/:jobId',
  authController.protect,
  authController.restrictTo('recruiter'),
  jobController.getJobApplicants,
);

// Recruiter updates status
router.patch(
  '/updateApplicantsJobStatus/:jobId/applicants/:candidateProfileId',
  authController.protect,
  authController.restrictTo('recruiter'),
  jobController.updateApplicationStatus,
);

// Candidate Applyed All Jobs
router.get(
  '/candiadteAppliedJobs',
  authController.protect,
  jobController.candiadteAppliedJobs,
);

router.get(
  '/application-status/:jobId/',
  authController.protect,
  authController.restrictTo('candidate'),
  jobController.checkApplicationStatus,
);

router.get(
  '/dashboardStats',
  authController.protect,
  authController.restrictTo('recruiter'),
  jobController.getRecruiterDashboardStats,
);

router.get(
  '/allRecruiterCandidates',
  authController.protect,
  authController.restrictTo('recruiter'),
  jobController.getAllRecruiterCandidates,
);
module.exports = router;

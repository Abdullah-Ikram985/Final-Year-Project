const express = require('express');
const candidateController = require('../controller/candidateController');
const authController = require('../controller/authController');
const router = express.Router();

router.post(
  '/saved-jobs/:jobId',
  authController.protect,
  candidateController.savedJob,
);
router.get(
  '/saved-jobs',
  authController.protect,
  candidateController.getSavedJobs,
);
router.delete(
  '/unsaved-jobs/:jobId',
  authController.protect,
  candidateController.unsavedJob,
);

// Recruiter opens a candidate profile — log/increment the view count
router.post(
  '/:id/view',
  authController.protect,
  authController.restrictTo('recruiter'),
  candidateController.incrementProfileView,
);

module.exports = router;

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

module.exports = router;

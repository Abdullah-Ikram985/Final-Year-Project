const express = require('express');
const upload = require('../utils/resumeUpload.js');
const getResumeData = require('../controller/resumeController.js');
const {
  saveCareerRoadmap,
  getCareerRoadmap,
} = require('../controller/careerRoadmapController.js');
const authController = require('../controller/authController.js');

const router = express.Router();

router.get(
  '/getResumeData',
  authController.protect,
  upload.single('file'),
  getResumeData,
);

// Career Roadmap routes
router.post('/saveCareerRoadmap', authController.protect, saveCareerRoadmap);

router.get('/getCareerRoadmap', authController.protect, getCareerRoadmap);

module.exports = router;

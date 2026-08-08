const express = require('express');
const authController = require('../controller/authController');
const recruiterController = require('../controller/recruiterController');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('recruiter'));

router.get('/profile', recruiterController.getRecruiterProfile);
router.patch('/profile', recruiterController.updateRecruiterProfile);

module.exports = router;

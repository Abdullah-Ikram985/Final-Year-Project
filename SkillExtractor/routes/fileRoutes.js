const express = require('express');
const uploadController = require('../controller/uploadController');
const authController = require('../controller/authController');
const router = express.Router();

// Upload an image
router.post(
  '/uploadImage',
  authController.protect,
  uploadController.uploadImage,
  uploadController.uploadToCloudinary('user_profile_images', 'image'),
);

// Upload a PDF
router.post(
  '/uploadPDF',
  authController.protect,
  uploadController.uploadPDF,
  uploadController.uploadToCloudinary('user_pdfs', 'raw'),


);

module.exports = router;

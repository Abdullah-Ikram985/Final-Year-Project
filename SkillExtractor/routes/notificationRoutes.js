const express = require('express');
const notificationController = require('../controller/notificationController');
const authController = require('../controller/authController');

const router = express.Router();

// All notification routes are protected
router.use(authController.protect);

router.get('/', notificationController.getMyNotifications);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

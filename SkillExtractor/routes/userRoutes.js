const express = require('express');
const userController = require('../controller/userController.js');
const authController = require('../controller/authController.js');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword,
);

router.post(
  '/sendFcmToken',
  authController.protect,
  userController.set_fcm_token,
);

router.get(
  '/send-fcm-noti/:id',
  authController.protect,
  userController.send_fcm_notifucation,
);
// CREATE NEW USER
router.post('/create', userController.createUser);

// UPDATE CURRENT LOGIN USER (BASED ON TOKEN)
router.patch(
  '/updateUser',
  authController.protect,
  userController.updateCurrentUser,
);

router.post('/checkEmail', userController.getUserBasedOnEmail);
// GET USER BASED ON ID
router.get(
  '/getUserById/:id',
  authController.protect,
  userController.getUserByID,
);
// GET ALL USERS
router.get('/allUsers', authController.protect, userController.getAllUsers);

// GET CURRENT LOGIN USER (BASED ON TOKEN)
router.get(
  '/me',
  authController.protect,
  userController.attachUserProfile,
  userController.getUserBasedOnToken,
);

// DELETE USER BY ID
router.delete(
  '/deleteUserById/:userId',
  authController.protect,
  userController.deleteUserById,
);

// DELETE CURRENT LOGIN USER (BASED ON TOKEN)
router.delete(
  '/deleteUserAccount',
  authController.protect,
  userController.deleteCurrentUser,
);
module.exports = router;

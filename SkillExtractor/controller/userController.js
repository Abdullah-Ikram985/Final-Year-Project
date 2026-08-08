const AppError = require('../utils/appError');
const checkAsync = require('../utils/checkAsync');
const User = require('../models/userModel');

const CandidateProfile = require('../models/candidateProfileSchema');
const RecruiterProfile = require('../models/recruiterProfileSchema');

const sendPushNotification = require('../utils/sendPush');

exports.createUser = checkAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Successfully created',
    data: {
      user,
    },
  });
});

exports.updateCurrentUser = checkAsync(async (req, res, next) => {
  const {
    name,
    role,
    title,
    institution,
    phoneNumber,
    location,
    linkedinProfileLink,
    personalWebsiteLink,
    skills,
    professionalBio,
    experience,
    education,
    preferredRole,
  } = req.body;

  // ── 1. Update User document (name, initials) ──────────────────────
  const userUpdateData = {};

  if (name) {
    userUpdateData.name = name;
    userUpdateData.profileInitials = name
      .trim()
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  if (role) userUpdateData.role = role;

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    userUpdateData,
    { new: true },
  );

  // ── 2. Update CandidateProfile document ───────────────────────────
  const profileUpdateData = {
    title,
    institution,
    phoneNumber,
    location,
    linkedinProfileLink,
    personalWebsiteLink,
    skills,
    professionalBio,
    experience,
    education,
    preferredRole,
  };

  const userProfile = await CandidateProfile.findOneAndUpdate(
    { user: req.user.id },
    profileUpdateData,
    { new: true },
  );

  res.status(200).json({
    status: 'success',
    message: 'Data successfully updated.',
    data: {
      user: updatedUser, // ✅ includes imageUrl if set by upload
      userProfile,
    },
  });
});
// GET USER BASED ON EMAIL
exports.getUserBasedOnEmail = checkAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({
      status: 'fail',
      isSuccess: false,
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'user exist',
    isSuccess: true,
    user,
  });
});
// GET USER BY ID
exports.getUserByID = checkAsync(async (req, res, next) => {
  if (!req.params.id) return next(new AppError('User Id is missing', 404));

  const user = await User.findById(req.params.id);

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// GET ALL USERS
exports.getAllUsers = checkAsync(async (req, res, next) => {
  // Pagination
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 10;
  const skip = (page - 1) * limit;
  const totalUsers = await User.countDocuments();
  const totalPages = Math.ceil(totalUsers / limit);

  const users = await User.find().skip(skip).limit(limit);

  res.status(200).json({
    status: 'success',
    totalPages: totalPages,
    totalResults: totalUsers,
    currentPage: page,
    limit: limit,
    currentResults: users.length,
    data: {
      users,
    },
  });
});

exports.attachUserProfile = checkAsync(async (req, res, next) => {
  if (!req.user) return next();

  const userId = req.user._id;

  // Try candidate profile
  const candidateProfile = await CandidateProfile.findOne({ user: userId });

  if (candidateProfile) {
    const baseUser = req.user.toObject();
    const profile = candidateProfile.toObject();

    delete profile.user;
    delete profile._id;
    delete profile.createdAt;
    delete profile.updatedAt;
    delete profile.__v;

    req.user = {
      ...baseUser,
      ...profile,
      _id: baseUser._id,
      profileId: candidateProfile._id,
    };

    return next();
  }

  // Try recruiter profile
  const recruiterProfile = await RecruiterProfile.findOne({ user: userId });

  if (recruiterProfile) {
    const baseUser = req.user.toObject();
    const profile = recruiterProfile.toObject();

    delete profile.user;
    delete profile._id;
    delete profile.createdAt;
    delete profile.updatedAt;
    delete profile.__v;

    req.user = {
      ...baseUser,
      ...profile,
      _id: baseUser._id,
      profileId: recruiterProfile._id,
    };

    return next();
  }

  // No profile found — continue with base user
  next();
});

// GET CURRENT USER (BASED ON TOKEN) // Get Me
exports.getUserBasedOnToken = checkAsync(async (req, res, next) => {
  const user = req.user;

  let profileData = {};

  if (user.role === 'recruiter') {
    const profile = await RecruiterProfile.findOne({ user: user._id }).lean();
    if (profile) {
      const { _id, user: _, createdAt, updatedAt, __v, ...fields } = profile;
      profileData = { ...fields, profileId: _id };
    }
  }

  const mergedUser = {
    ...(typeof user.toObject === 'function' ? user.toObject() : user),
    ...profileData,
  };

  res.status(200).json({
    status: 'success',
    data: { user: mergedUser },
  });
});

// DELETE USER BY ID
exports.deleteUserById = checkAsync(async (req, res, next) => {
  const userId = req.params.userId;
  if (!userId)
    return next(new AppError('User Id is required. For deleting user!', 400));

  const user = await User.findByIdAndDelete(userId);
  console.log(' User  =   -   -  -> ', user);

  res.status(204).json({
    status: 'success',
    message: 'User successfully delete.',
  });
});

// DELETE CURRENT USER (BASED ON TOKEN)
exports.deleteCurrentUser = checkAsync(async (req, res, next) => {
  if (!req.user) return next(new AppError('User Dos not exist.', 404));
  const delete_Current_User = await User.findByIdAndDelete(req.user.id);
  res.status(204).json({
    status: 'success',
    message: 'User successfully delete.',
  });
});

exports.set_fcm_token = checkAsync(async (req, res, next) => {
  // console.log('Current User  login ', req.user);

  const fcm_token = { fcmToken: req.body.fcmToken };

  if (!fcm_token) return next(new AppError('Fcm Token required!', 404));

  const updateUser = await User.findByIdAndUpdate(req.user.id, fcm_token, {
    new: true,
  });

  res.status(200).json({
    status: 'success',
    updateUser,
  });
});

exports.send_fcm_notifucation = checkAsync(async (req, res, next) => {
  const userId = req.params.id;
  // console.log(userId);
  const user = await User.findById(userId);

  if (!user?.fcmToken) {
    return res.status(400).json({ message: 'User has no FCM token' });
  }

  const fcm_Token = await sendPushNotification(user.fcmToken);

  res.status(200).json({
    status: 'success',
    fcm_Token,
  });
});

const checkAsync = require('../utils/checkAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const RecruiterProfile = require('../models/recruiterProfileSchema');

// ── GET RECRUITER PROFILE ──────────────────────────────────────────────────
exports.getRecruiterProfile = checkAsync(async (req, res, next) => {
  const profile = await RecruiterProfile.findOne({ user: req.user.id });

  if (!profile) return next(new AppError('Recruiter profile not found', 404));

  res.status(200).json({
    status: 'success',
    data: { profile },
  });
});

// ── UPDATE RECRUITER PROFILE ───────────────────────────────────────────────
exports.updateRecruiterProfile = checkAsync(async (req, res, next) => {
  const {
    name,
    companyName,
    companyWebsite,
    companySize,
    industry,
    designation,
    phoneNumber,
    location,
    linkedinProfileLink,
    professionalBio,
    companyLogoUrl,
  } = req.body;

  // ── 1. Update User (name + initials) ──────────────────────────────
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

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    userUpdateData,
    { new: true },
  );

  // ── 2. Update RecruiterProfile ─────────────────────────────────────
  const profileData = {};
  if (companyName !== undefined) profileData.companyName = companyName;
  if (companyWebsite !== undefined) profileData.companyWebsite = companyWebsite;
  if (companySize !== undefined) profileData.companySize = companySize;
  if (industry !== undefined) profileData.industry = industry;
  if (designation !== undefined) profileData.designation = designation;
  if (phoneNumber !== undefined) profileData.phoneNumber = phoneNumber;
  if (location !== undefined) profileData.location = location;
  if (linkedinProfileLink !== undefined)
    profileData.linkedinProfileLink = linkedinProfileLink;
  if (professionalBio !== undefined)
    profileData.professionalBio = professionalBio;
  if (companyLogoUrl !== undefined) profileData.companyLogoUrl = companyLogoUrl;

  const updatedProfile = await RecruiterProfile.findOneAndUpdate(
    { user: req.user.id },
    profileData,
    { new: true },
  );

  if (!updatedProfile)
    return next(new AppError('Recruiter profile not found', 404));

  // ── 3. Merge into one object so frontend can setUser() directly ────
  const {
    _id: profileId,
    user: _,
    createdAt,
    updatedAt,
    __v,
    ...profileFields
  } = updatedProfile.toObject();

  const mergedUser = {
    ...updatedUser.toObject(),
    ...profileFields,
    profileId,
  };

  res.status(200).json({
    status: 'success',
    message: 'Recruiter profile updated successfully',
    data: {
      user: mergedUser, // ← single merged object
    },
  });
});

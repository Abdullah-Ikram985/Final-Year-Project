const CheckAsync = require('../utils/checkAsync');
const AppError = require('../utils/appError');

const User = require('../models/userModel');
const CandidateProfile = require('../models/candidateProfileSchema');

exports.savedJob = CheckAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const candidateProfile = await CandidateProfile.findOneAndUpdate(
    {
      user: req.user.id,
    },
    {
      $addToSet: { savedJobs: jobId },
    },
    {
      new: true,
    },
  );

  if (!candidateProfile)
    return next(new AppError('Candidate profile not found', 404));

  res.status(200).json({
    status: 'success',
    message: 'Job saved successfully',
    data: { savedJob: candidateProfile.savedJobs },
  });
});

exports.unsavedJob = CheckAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const candidateProfile = await CandidateProfile.findOneAndUpdate(
    {
      user: req.user.id,
    },
    {
      $pull: { savedJobs: jobId },
    },
    {
      new: true,
    },
  );

  if (!candidateProfile)
    return next(new AppError('Candidate profile not found', 404));

  res.status(200).json({
    status: 'success',
    message: 'Job removed from saved list',
    data: { savedJobs: candidateProfile.savedJobs },
  });
});

exports.getSavedJobs = CheckAsync(async (req, res, next) => {
    
  const profile = await CandidateProfile.findOne({
    user: req.user.id,
  }).populate('savedJobs');

  if (!profile) return next(new AppError('Candidate profile not found', 404));

  res.status(200).json({
    status: 'success',
    data: {
      savedJobs: profile.savedJobs,
      savedJobsLength: profile.savedJobs.length,
    },
  });
});

// Called when a recruiter opens a candidate's profile — increments the
// candidate's profileView counter. :id is the CandidateProfile._id.
exports.incrementProfileView = CheckAsync(async (req, res, next) => {
  const { id } = req.params;

  const candidateProfile = await CandidateProfile.findByIdAndUpdate(
    id,
    { $inc: { profileView: 1 } },
    { new: true },
  );

  if (!candidateProfile)
    return next(new AppError('Candidate profile not found', 404));

  res.status(200).json({
    status: 'success',
    data: { profileView: candidateProfile.profileView },
  });
});

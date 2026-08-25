const Job = require('../models/jobSchema');
const RecruiterProfile = require('../models/recruiterProfileSchema');
const CandidateProfile = require('../models/candidateProfileSchema');
const MockInterview = require('../models/mockInterviewSchema');
const Notification = require('../models/notificationSchema');
const checkAsync = require('../utils/checkAsync');
const AppError = require('../utils/appError');

const {
  generateEmbedding,
  cosineSimilarity,
  buildJobText,
  buildCandidateText,
} = require('../utils/embedding');

const getMatchLabel = (percent) => {
  if (percent >= 80) return 'Excellent Match';
  if (percent >= 60) return 'Strong Match';
  if (percent >= 40) return 'Good Match';
  if (percent >= 20) return 'Partial Match';
  return 'Low Match';
};

const normalizeStatus = (status) => {
  if (!status) return 'Closed';
  const lower = status.toLowerCase();
  if (lower === 'active') return 'Active';
  if (lower === 'draft') return 'Draft';
  if (lower === 'pending') return 'Pending';
  if (lower === 'rejected') return 'Rejected';
  return 'Closed';
};

exports.createJob = checkAsync(async (req, res, next) => {
  const { title, department, location, salary, jobType, skills, description } =
    req.body;

  if (!title || !department || !location || !salary || !jobType || !skills)
    return next(new AppError('Some required keys are missing', 400));

  const recruiterProfile = await RecruiterProfile.findOne({
    user: req.user.id,
  });

  if (!recruiterProfile)
    return next(new AppError('Recruiter profile not found', 404));

  const newJob = await Job.create({
    createdBy: recruiterProfile._id,
    title,
    department,
    location,
    salary,
    jobType,
    skills,
    description,
    jobStatus: 'Pending',
  });

  try {
    const jobText = buildJobText(newJob);
    const embedding = await generateEmbedding(jobText);
    newJob.embedding = embedding;
    await newJob.save();
  } catch (err) {
    console.warn('Embedding generation failed on create:', err.message);
  }

  res.status(201).json({
    status: 'success',
    message: 'Job submitted successfully and is awaiting admin approval.',
    data: { job: newJob },
  });
});

exports.getAllJobsOfRecruiter = checkAsync(async (req, res, next) => {
  const recruiterProfile = await RecruiterProfile.findOne({
    user: req.user.id,
  });

  if (!recruiterProfile)
    return next(new AppError('Recruiter profile not found', 404));

  const jobs = await Job.find({ createdBy: recruiterProfile._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    status: 'success',
    data: {
      totalJobs: jobs.length,
      jobs,
    },
  });
});

exports.updateJobStatus = checkAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const { jobStatus } = req.body;

  const recruiterProfile = await RecruiterProfile.findOne({
    user: req.user.id,
  });
  if (!recruiterProfile)
    return next(new AppError('Recruiter profile not found', 404));

  const job = await Job.findOne({
    _id: jobId,
    createdBy: recruiterProfile._id,
  }).select('+embedding');

  if (!job)
    return next(new AppError('No job found with that ID or unauthorized', 404));

  const targetStatus = normalizeStatus(jobStatus);

  // Recruiter cannot self-approve a pending or rejected job
  if (
    targetStatus === 'Active' &&
    (job.jobStatus === 'Pending' ||
      job.jobStatus === 'pending' ||
      job.jobStatus === 'Rejected' ||
      job.jobStatus === 'rejected')
  ) {
    return next(
      new AppError(
        'Pending or Rejected jobs cannot be set to Active without admin approval.',
        400,
      ),
    );
  }

  job.jobStatus = targetStatus;

  if (job.jobStatus === 'Active') {
    try {
      console.log(`Regenerating embedding for job: ${job.title}`);
      const jobText = buildJobText(job);
      job.embedding = await generateEmbedding(jobText);
      console.log(`Embedding regenerated successfully for: ${job.title}`);
    } catch (err) {
      console.warn('Failed to regenerate embedding:', err.message);
    }
  }

  await job.save();

  res.status(200).json({
    status: 'success',
    data: { job },
  });
});

exports.getJobById = checkAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate({
    path: 'createdBy',
    populate: { path: 'user', select: 'name email' },
  });

  if (!job) return next(new AppError('No job found with that ID', 404));

  res.status(200).json({
    status: 'success',
    data: { job },
  });
});

exports.getAllJobs = checkAsync(async (req, res, next) => {
  const filter = {};

  if (req.query.status) {
    if (req.query.status === 'all' || req.query.status === 'All') {
      // Return all jobs (e.g. for admin)
    } else {
      filter.jobStatus = req.query.status;
    }
  } else {
    // Default candidate/public listing: ONLY return Active jobs
    filter.jobStatus = { $in: ['Active', 'active'] };
  }

  const jobs = await Job.find(filter)
    .populate({
      path: 'createdBy',
      populate: { path: 'user', select: 'name email' },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    totalJobs: jobs.length,
    data: { jobs },
  });
});

exports.applyToJob = checkAsync(async (req, res, next) => {
  const { jobId } = req.params;

  // 1. Find candidate profile
  const candidateProfile = await CandidateProfile.findOne({
    user: req.user.id,
  });
  if (!candidateProfile)
    return next(new AppError('Candidate profile not found', 404));

  // 2. Find the job
  const job = await Job.findById(jobId).populate({
    path: 'createdBy',
    populate: { path: 'user', select: 'name email fcmToken' },
  });
  if (!job) return next(new AppError('Job not found', 404));

  // 3. Only active jobs
  if (job.jobStatus !== 'Active')
    return next(
      new AppError('This job is no longer accepting applications', 400),
    );

  // 3.5 Check whether candidate completed Mock Interview for this specific job
  const completedInterview = await MockInterview.findOne({
    candidate: req.user.id,
    job: jobId,
    status: 'completed',
  });

  if (!completedInterview) {
    return next(
      new AppError(
        'Please complete the AI Mock Interview before applying to this job.',
        403,
      ),
    );
  }

  // 4. Duplicate check — now using subdocument structure
  const alreadyApplied = job.applicants.some(
    (a) => a.candidate.toString() === candidateProfile._id.toString(),
  );
  if (alreadyApplied)
    return res.status(400).json({
      status: 'fail',
      message: 'You have already applied to this job',
    });

  // 5. Push into Job.applicants (with status)
  job.applicants.push({
    candidate: candidateProfile._id,
    appliedAt: new Date(),
    status: 'pending',
  });
  await job.save();

  // 6. Push into CandidateProfile.appliedJobs (with status)
  const alreadyInProfile = candidateProfile.appliedJobs.some(
    (a) => a.job.toString() === jobId,
  );
  if (!alreadyInProfile) {
    candidateProfile.appliedJobs.push({
      job: jobId,
      appliedAt: new Date(),
      status: 'pending',
    });
    await candidateProfile.save();
  }

  // 7. Create notification for Candidate
  try {
    const candidateMsg = `Your application for "${job.title}" has been submitted.`;
    await Notification.create({
      recipient: req.user._id,
      type: 'application_submitted',
      title: 'Application Submitted',
      message: candidateMsg,
      jobId: job._id,
      isRead: false,
    });

    if (req.user.fcmToken) {
      const sendPushNotification = require('../utils/sendPush');
      await sendPushNotification(
        req.user.fcmToken,
        'Application Submitted',
        candidateMsg,
      );
    }
  } catch (notifErr) {
    console.warn('Candidate application notification failed:', notifErr.message);
  }

  // 8. Create / Consolidate notification for Recruiter (Job owner) - Grouped by Job
  try {
    const recruiterUserId = job.createdBy?.user?._id || job.createdBy?.user;
    if (recruiterUserId) {
      const candidateName = req.user.name || 'A candidate';

      // Find existing application_received notification for this job & recruiter
      const existingNotif = await Notification.findOne({
        recipient: recruiterUserId,
        type: 'application_received',
        jobId: job._id,
      }).sort({ createdAt: -1 });

      if (existingNotif) {
        // Collect existing candidate names
        const names =
          existingNotif.candidateNames && existingNotif.candidateNames.length > 0
            ? [...existingNotif.candidateNames]
            : [existingNotif.message ? existingNotif.message.split(' ')[0] : 'Candidate'];

        if (!names.includes(candidateName)) {
          names.push(candidateName);
        }

        const count = (existingNotif.applicantCount || 1) + 1;
        const profileIds =
          existingNotif.candidateProfiles && existingNotif.candidateProfiles.length > 0
            ? [...existingNotif.candidateProfiles, candidateProfile._id]
            : [existingNotif.candidateProfileId, candidateProfile._id].filter(Boolean);

        existingNotif.candidateNames = names;
        existingNotif.applicantCount = count;
        existingNotif.candidateProfiles = profileIds;
        existingNotif.candidateProfileId = candidateProfile._id;
        existingNotif.title = job.title;
        existingNotif.message = `${count} new applicants applied for ${job.title}`;
        existingNotif.isRead = false;
        existingNotif.createdAt = new Date();
        await existingNotif.save();

        // Consolidate: Remove any other duplicate notifications for this job
        await Notification.deleteMany({
          recipient: recruiterUserId,
          type: 'application_received',
          jobId: job._id,
          _id: { $ne: existingNotif._id },
        });
      } else {
        // Create initial notification for this job
        await Notification.create({
          recipient: recruiterUserId,
          type: 'application_received',
          title: job.title,
          message: `${candidateName} applied`,
          jobId: job._id,
          candidateProfileId: candidateProfile._id,
          candidateProfiles: [candidateProfile._id],
          candidateNames: [candidateName],
          applicantCount: 1,
          isRead: false,
        });
      }

      const pushMsg = `New application for "${job.title}" from ${candidateName}.`;
      if (job.createdBy?.user?.fcmToken) {
        const sendPushNotification = require('../utils/sendPush');
        await sendPushNotification(
          job.createdBy.user.fcmToken,
          job.title,
          pushMsg,
        );
      }
    }
  } catch (notifErr) {
    console.warn('Recruiter application notification failed:', notifErr.message);
  }

  res.status(200).json({
    status: 'success',
    message: 'Application submitted successfully',
    data: {
      jobId: job._id,
      jobTitle: job.title,
      applicantsCount: job.applicants.length,
    },
  });
});

exports.updateApplicationStatus = checkAsync(async (req, res, next) => {
  const { jobId, candidateProfileId } = req.params;
  const { status } = req.body;

  const validStatuses = [
    'pending',
    'reviewed',
    'shortlisted',
    'rejected',
    'hired',
  ];
  if (!validStatuses.includes(status))
    return next(new AppError('Invalid status value', 400));

  // 1. Verify recruiter owns this job
  const recruiterProfile = await RecruiterProfile.findOne({
    user: req.user.id,
  });
  if (!recruiterProfile)
    return next(new AppError('Recruiter profile not found', 404));

  const job = await Job.findOne({
    _id: jobId,
    createdBy: recruiterProfile._id,
  });
  if (!job) return next(new AppError('Job not found or unauthorized', 404));

  // 2. Update status in Job.applicants
  const applicant = job.applicants.find(
    (a) => a.candidate.toString() === candidateProfileId,
  );
  if (!applicant)
    return next(new AppError('Candidate not found in this job', 404));

  applicant.status = status;
  await job.save();

  // 3. Sync status in CandidateProfile.appliedJobs
  await CandidateProfile.updateOne(
    { _id: candidateProfileId, 'appliedJobs.job': jobId },
    { $set: { 'appliedJobs.$.status': status } },
  );

  // 4. Send notification to Candidate
  try {
    const candidateProfile = await CandidateProfile.findById(
      candidateProfileId,
    ).populate('user', 'name email fcmToken');

    const candidateUserId =
      candidateProfile?.user?._id || candidateProfile?.user;

    if (candidateUserId) {
      let notifTitle = 'Application Status Updated';
      let notifMessage = `Your application status for "${job.title}" has been updated to "${status}".`;
      let notifType = 'application_status_updated';

      if (status === 'shortlisted') {
        notifTitle = 'Shortlisted 🎉';
        notifMessage = `🎉 You have been shortlisted for "${job.title}".`;
        notifType = 'application_shortlisted';
      } else if (status === 'rejected') {
        notifTitle = 'Application Update';
        notifMessage = `Your application for "${job.title}" was not selected.`;
        notifType = 'application_rejected';
      } else if (status === 'reviewed') {
        notifTitle = 'Application Reviewed';
        notifMessage = `Your application for "${job.title}" has been reviewed.`;
        notifType = 'application_reviewed';
      } else if (status === 'hired') {
        notifTitle = 'Application Accepted 🎉';
        notifMessage = `🎉 Congratulations! You have been hired for "${job.title}".`;
        notifType = 'application_status_updated';
      }

      await Notification.create({
        recipient: candidateUserId,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        jobId: job._id,
        isRead: false,
      });

      if (candidateProfile?.user?.fcmToken) {
        const sendPushNotification = require('../utils/sendPush');
        await sendPushNotification(
          candidateProfile.user.fcmToken,
          notifTitle,
          notifMessage,
        );
      }
    }
  } catch (notifErr) {
    console.warn(
      'Candidate status update notification failed:',
      notifErr.message,
    );
  }

  res.status(200).json({
    status: 'success',
    message: `Application status updated to "${status}"`,
    data: { jobId, candidateProfileId, newStatus: status },
  });
});

// exports.getJobApplicants = checkAsync(async (req, res, next) => {
//   const { jobId } = req.params;

//   // Verify recruiter owns this job
//   const recruiterProfile = await RecruiterProfile.findOne({
//     user: req.user.id,
//   });
//   if (!recruiterProfile)
//     return next(new AppError('Recruiter profile not found', 404));

//   const job = await Job.findOne({
//     _id: jobId,
//     createdBy: recruiterProfile._id,
//   }).populate({
//     path: 'applicants.candidate',
//     select: 'title location skills experience education pdfUrl',
//     populate: { path: 'user', select: 'name email imageUrl' },
//   });

//   if (!job) return next(new AppError('Job not found or unauthorized', 404));

//   res.status(200).json({
//     status: 'success',
//     totalApplicants: job.applicants.length,
//     data: { applicants: job.applicants },
//   });
// });
exports.getJobApplicants = checkAsync(async (req, res, next) => {
  const { jobId } = req.params;

  const recruiterProfile = await RecruiterProfile.findOne({
    user: req.user.id,
  });
  if (!recruiterProfile)
    return next(new AppError('Recruiter profile not found', 404));

  const job = await Job.findOne({
    _id: jobId,
    createdBy: recruiterProfile._id,
  }).populate({
    path: 'applicants.candidate',
    select: 'title location skills experience education pdfUrl user',
    populate: { path: 'user', select: 'name email imageUrl' },
  });

  if (!job) return next(new AppError('Job not found or unauthorized', 404));

  // ── Build job embedding text once for comparison ──────────────────────────
  const jobWithEmbedding = await Job.findById(jobId).select('+embedding');

  const validApplicants = (job.applicants || []).filter(
    (entry) => entry.candidate,
  );

  const applicantsWithMatch = await Promise.all(
    validApplicants.map(async (entry) => {
      const candidate = entry.candidate;

      let matchPercent = null;
      let matchLabel = null;

      try {
        if (jobWithEmbedding?.embedding?.length > 0 && candidate) {
          // Build candidate text and generate their embedding
          const candidateText = buildCandidateText(candidate);
          const candidateEmbedding = await generateEmbedding(candidateText);

          const score = cosineSimilarity(
            candidateEmbedding,
            jobWithEmbedding.embedding,
          );
          matchPercent = Math.round(score * 100 * 10) / 10;
          matchLabel = getMatchLabel(matchPercent);
        }
      } catch (err) {
        console.warn('Match score failed for candidate:', err.message);
      }

      // Fetch AI Mock Interview status for this candidate on this job
      let aiInterview = {
        completed: false,
        overallReadinessScore: null,
      };
      if (candidate?.user?._id || candidate?.user) {
        const candidateUserId = candidate.user._id || candidate.user;
        const interview = await MockInterview.findOne({
          candidate: candidateUserId,
          job: jobId,
          status: 'completed',
        }).select('overallReadinessScore breakdown status completedAt');

        if (interview) {
          aiInterview = {
            completed: true,
            overallReadinessScore: interview.overallReadinessScore,
            breakdown: interview.breakdown,
            status: interview.status,
            completedAt: interview.completedAt,
          };
        }
      }

      return {
        _id: entry._id,
        status: entry.status,
        appliedAt: entry.appliedAt,
        candidate,
        jobId: job._id,
        jobTitle: job.title,
        jobDepartment: job.department,
        matchPercent,
        matchLabel,
        aiInterview,
      };
    }),
  );

  // Sort newest application first (appliedAt descending)
  applicantsWithMatch.sort(
    (a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0),
  );

  res.status(200).json({
    status: 'success',
    totalApplicants: applicantsWithMatch.length,
    data: { applicants: applicantsWithMatch },
  });
});
//  ALL JOBS IN WHICH CANDIDATE APPLY
exports.candiadteAppliedJobs = checkAsync(async (req, res, next) => {
  const candidateProfile = await CandidateProfile.findOne({
    user: req.user.id,
  });
  if (!candidateProfile)
    return next(new AppError('Candidate Profile not found!', 401));

  // Populate job details + createdBy
  const populated = await candidateProfile.populate({
    path: 'appliedJobs.job',
    select: '+embedding', // ← need embedding to calculate match
    populate: {
      path: 'createdBy',
      select: 'companyName companyLogoUrl',
    },
  });

  // Generate candidate embedding once
  const candidateText = buildCandidateText(candidateProfile);
  const candidateEmbedding = await generateEmbedding(candidateText);

  const appliedJobs = populated.appliedJobs
    .filter((entry) => entry.job)
    .map((entry) => {
      const job = entry.job;

      // Calculate match percent if embedding exists
      let matchPercent = null;
      if (job.embedding && job.embedding.length > 0) {
        const score = cosineSimilarity(candidateEmbedding, job.embedding);
        matchPercent = Math.round(score * 100 * 10) / 10;
      }

      // Remove embedding from response — frontend doesn't need it
      const { embedding, ...jobWithoutEmbedding } = job.toObject();

      return {
        job: jobWithoutEmbedding,
        appliedAt: entry.appliedAt,
        status: entry.status,
        matchPercent, // ← now included
        matchLabel: getMatchLabel(matchPercent ?? 0),
      };
    });

  res.status(200).json({
    status: 'success',
    data: { appliedJobs },
  });
});

exports.checkApplicationStatus = checkAsync(async (req, res, next) => {
  const { jobId } = req.params;

  const candidateProfile = await CandidateProfile.findOne({
    user: req.user.id,
  });
  if (!candidateProfile)
    return next(new AppError('Candidate Profile not found!', 404));

  const hasApplied = candidateProfile.appliedJobs.some(
    (entry) => entry.job.toString() === jobId,
  );

  const completedInterview = await MockInterview.findOne({
    candidate: req.user.id,
    job: jobId,
    status: 'completed',
  });

  res.status(200).json({
    status: 'success',
    data: {
      hasApplied,
      hasCompletedMockInterview: !!completedInterview,
      mockInterviewId: completedInterview?._id || null,
      readinessScore: completedInterview?.overallReadinessScore || null,
    },
  });
});

// DELETE JOB BY ID
exports.deleteJobById = checkAsync(async (req, res, next) => {
  const deletedJob = await Job.findByIdAndDelete(req.params.id);

  if (!deletedJob) return next(new AppError('No job found with that ID', 404));

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/jobs/recommended
// ─── FIX: Now returns BOTH active and closed jobs that match the candidate.
// Active jobs: must have > 60% match — fully clickable.
// Closed jobs: must have > 60% match — shown as disabled/greyed out.
// This way candidates can see closed jobs but cannot apply to them.
// ─────────────────────────────────────────────────────────────────────────────
exports.getRecommendedJobs = checkAsync(async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          'Candidate profile not found. Please complete your profile first.',
      });
    }

    const candidateText = buildCandidateText(profile);
    const candidateEmbedding = await generateEmbedding(candidateText);

    // Fetch ONLY Active jobs for candidates
    const allJobs = await Job.find({ jobStatus: { $in: ['Active', 'active'] } })
      .select('+embedding')
      .populate('createdBy', 'name email')
      .lean();

    console.log(`[Recommended] Total active jobs in DB: ${allJobs.length}`);
    console.log(
      `[Recommended] Active jobs with embeddings: ${allJobs.filter((j) => j.embedding?.length > 0).length}`,
    );

    if (allJobs.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No jobs available at the moment.',
      });
    }

    // Score every job with cosine similarity
    const scoredJobs = allJobs
      .filter((job) => job.embedding && job.embedding.length > 0)
      .map((job) => {
        const similarityScore = cosineSimilarity(
          candidateEmbedding,
          job.embedding,
        );
        const matchPercent = Math.round(similarityScore * 100 * 10) / 10;

        console.log(
          `[Recommended] "${job.title}" (${job.jobStatus}) → ${matchPercent}%`,
        );

        const { embedding, ...jobWithoutEmbedding } = job;

        return {
          ...jobWithoutEmbedding,
          matchPercent,
          matchLabel: getMatchLabel(matchPercent),
        };
      })
      // Keep jobs above 60% threshold
      .filter((job) => job.matchPercent > 60)
      .sort((a, b) => b.matchPercent - a.matchPercent);

    console.log(
      `[Recommended] Active jobs passing 60% threshold: ${scoredJobs.length}`,
    );

    res.status(200).json({
      success: true,
      count: scoredJobs.length,
      data: scoredJobs,
    });
  } catch (error) {
    console.error('getRecommendedJobs error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

exports.jobDetail = checkAsync(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId).populate({
    path: 'createdBy',
    populate: { path: 'user' },
  });

  if (!job) {
    return res.status(404).json({
      status: 'fail',
      message: 'Job not found',
    });
  }

  // If candidate is requesting a non-active job, block it
  if (
    req.user?.role === 'candidate' &&
    job.jobStatus !== 'Active' &&
    job.jobStatus !== 'active'
  ) {
    return res.status(404).json({
      status: 'fail',
      message: 'Job not found or not available',
    });
  }

  res.status(200).json({
    status: 'success',
    data: { job },
  });
});

exports.backfillJobEmbeddings = checkAsync(async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res
        .status(403)
        .json({ success: false, message: 'Recruiters only' });
    }

    const jobsWithoutEmbeddings = await Job.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } },
        { embedding: null },
      ],
    }).select('+embedding');

    if (jobsWithoutEmbeddings.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All jobs already have embeddings.',
      });
    }

    let processed = 0;
    let failed = 0;

    for (const job of jobsWithoutEmbeddings) {
      try {
        const jobText = buildJobText(job);
        job.embedding = await generateEmbedding(jobText);
        await job.save();
        processed++;
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`Failed to embed job ${job._id}:`, err.message);
        failed++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Backfill complete. Processed: ${processed}, Failed: ${failed}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

exports.getRecruiterDashboardStats = checkAsync(async (req, res, next) => {
  const recruiterProfile = await RecruiterProfile.findOne({
    user: req.user.id,
  });
  if (!recruiterProfile)
    return next(new AppError('Recruiter profile not found', 404));

  const jobs = await Job.find({ createdBy: recruiterProfile._id });

  const activeJobs = jobs.filter((j) => j.jobStatus === 'Active' || j.jobStatus === 'active').length;
  const pendingJobs = jobs.filter((j) => j.jobStatus === 'Pending' || j.jobStatus === 'pending').length;
  const rejectedJobs = jobs.filter((j) => j.jobStatus === 'Rejected' || j.jobStatus === 'rejected').length;
  const closedJobs = jobs.filter((j) => j.jobStatus === 'Closed' || j.jobStatus === 'closed').length;

  // Per-job applicant breakdown
  const jobBreakdown = jobs.map((job) => ({
    jobId: job._id,
    jobTitle: job.title,
    department: job.department,
    jobStatus: job.jobStatus,
    totalApplicants: job.applicants.length,
    shortlisted: job.applicants.filter((a) => a.status === 'shortlisted')
      .length,
    hired: job.applicants.filter((a) => a.status === 'hired').length,
  }));

  // Totals across all jobs
  const totalCandidates = jobs.reduce((acc, j) => acc + j.applicants.length, 0);
  const totalShortlisted = jobs.reduce(
    (acc, j) =>
      acc + j.applicants.filter((a) => a.status === 'shortlisted').length,
    0,
  );
  const totalHired = jobs.reduce(
    (acc, j) => acc + j.applicants.filter((a) => a.status === 'hired').length,
    0,
  );

  res.status(200).json({
    status: 'success',
    data: {
      activeJobs,
      pendingJobs,
      rejectedJobs,
      closedJobs,
      totalCandidates,
      totalShortlisted,
      totalHired,
      jobBreakdown,
    },
  });
});

exports.getAllRecruiterCandidates = checkAsync(async (req, res, next) => {
  const recruiterProfile = await RecruiterProfile.findOne({
    user: req.user.id,
  });
  if (!recruiterProfile)
    return next(new AppError('Recruiter profile not found', 404));

  const jobs = await Job.find({ createdBy: recruiterProfile._id }).populate({
    path: 'applicants.candidate',
    select: 'title location skills experience education pdfUrl user',
    populate: { path: 'user', select: 'name email imageUrl' },
  });

  // Flatten all applicants across all jobs, attach job info and aiInterview
  const allApplicants = [];

  for (const job of jobs) {
    for (const entry of job.applicants) {
      let aiInterview = {
        completed: false,
        overallReadinessScore: null,
      };
      if (entry.candidate?.user?._id || entry.candidate?.user) {
        const candidateUserId = entry.candidate.user._id || entry.candidate.user;
        const interview = await MockInterview.findOne({
          candidate: candidateUserId,
          job: job._id,
          status: 'completed',
        }).select('overallReadinessScore breakdown status completedAt');

        if (interview) {
          aiInterview = {
            completed: true,
            overallReadinessScore: interview.overallReadinessScore,
            breakdown: interview.breakdown,
            status: interview.status,
            completedAt: interview.completedAt,
          };
        }
      }

      allApplicants.push({
        _id: entry._id,
        status: entry.status,
        appliedAt: entry.appliedAt,
        candidate: entry.candidate,
        jobId: job._id,
        jobTitle: job.title,
        jobDepartment: job.department,
        matchPercent: null,
        matchLabel: null,
        aiInterview,
      });
    }
  }

  // Sort newest application first (appliedAt descending)
  allApplicants.sort(
    (a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0),
  );

  res.status(200).json({
    status: 'success',
    totalCandidates: allApplicants.length,
    data: { applicants: allApplicants },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS (Job Approval / Rejection)
// ─────────────────────────────────────────────────────────────────────────────

exports.getPendingJobs = checkAsync(async (req, res, next) => {
  const jobs = await Job.find({
    jobStatus: { $in: ['Pending', 'pending'] },
  })
    .populate({
      path: 'createdBy',
      populate: { path: 'user', select: 'name email role' },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    totalJobs: jobs.length,
    data: { jobs },
  });
});

exports.getAdminJobs = checkAsync(async (req, res, next) => {
  const filter = {};
  if (
    req.query.status &&
    req.query.status !== 'All' &&
    req.query.status !== 'all'
  ) {
    filter.jobStatus = req.query.status;
  }

  const jobs = await Job.find(filter)
    .populate({
      path: 'createdBy',
      populate: { path: 'user', select: 'name email role' },
    })
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    totalJobs: jobs.length,
    data: { jobs },
  });
});

exports.approveJob = checkAsync(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId).populate({
    path: 'createdBy',
    populate: { path: 'user', select: 'name email fcmToken' },
  });

  if (!job) return next(new AppError('No job found with that ID', 404));

  if (job.jobStatus === 'Active') {
    return next(new AppError('Job is already approved and active', 400));
  }

  job.jobStatus = 'Active';
  job.approvedBy = req.user._id;
  job.approvedAt = new Date();
  job.rejectionReason = '';

  // Regenerate/ensure embedding
  try {
    const jobText = buildJobText(job);
    job.embedding = await generateEmbedding(jobText);
  } catch (err) {
    console.warn('Embedding generation skipped on approval:', err.message);
  }

  await job.save();

  // Create notification for recruiter
  try {
    const recruiterUserId = job.createdBy?.user?._id || job.createdBy?.user;
    if (recruiterUserId) {
      await Notification.create({
        recipient: recruiterUserId,
        type: 'job_approved',
        title: 'Job Approved',
        message: `Your job "${job.title}" has been approved and is now live.`,
        jobId: job._id,
        isRead: false,
      });

      // Attempt push notification if FCM available
      if (job.createdBy?.user?.fcmToken) {
        const sendPushNotification = require('../utils/sendPush');
        await sendPushNotification(
          job.createdBy.user.fcmToken,
          'Job Approved',
          `Your job "${job.title}" has been approved and is now live.`,
        );
      }
    }
  } catch (notifErr) {
    console.warn('Notification creation failed on approval:', notifErr.message);
  }

  res.status(200).json({
    status: 'success',
    message: 'Job approved successfully',
    data: { job },
  });
});

exports.rejectJob = checkAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const { reason } = req.body;

  const job = await Job.findById(jobId).populate({
    path: 'createdBy',
    populate: { path: 'user', select: 'name email fcmToken' },
  });

  if (!job) return next(new AppError('No job found with that ID', 404));

  if (job.jobStatus === 'Rejected') {
    return next(new AppError('Job is already rejected', 400));
  }

  job.jobStatus = 'Rejected';
  job.rejectedBy = req.user._id;
  job.rejectedAt = new Date();
  job.rejectionReason =
    reason || 'Your job posting does not meet our platform requirements.';

  await job.save();

  // Create notification for recruiter
  try {
    const recruiterUserId = job.createdBy?.user?._id || job.createdBy?.user;
    if (recruiterUserId) {
      const message = job.rejectionReason
        ? `Your job "${job.title}" has been rejected.\nReason: ${job.rejectionReason}`
        : `Your job "${job.title}" has been rejected.`;

      await Notification.create({
        recipient: recruiterUserId,
        type: 'job_rejected',
        title: 'Job Rejected',
        message,
        jobId: job._id,
        isRead: false,
      });

      // Attempt push notification if FCM available
      if (job.createdBy?.user?.fcmToken) {
        const sendPushNotification = require('../utils/sendPush');
        await sendPushNotification(
          job.createdBy.user.fcmToken,
          'Job Rejected',
          message,
        );
      }
    }
  } catch (notifErr) {
    console.warn(
      'Notification creation failed on rejection:',
      notifErr.message,
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Job rejected successfully',
    data: { job },
  });
});

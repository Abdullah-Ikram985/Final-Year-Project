const Job = require('../models/jobSchema');
const RecruiterProfile = require('../models/recruiterProfileSchema');
const CandidateProfile = require('../models/candidateProfileSchema');
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
    jobStatus: 'Active',
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
    data: { job: newJob },
  });
});

exports.getAllJobsOfRecruiter = checkAsync(async (req, res, next) => {
  const recruiterProfile = await RecruiterProfile.findOne({
    user: req.user.id,
  });

  if (!recruiterProfile)
    return next(new AppError('Recruiter profile not found', 404));

  const jobs = await Job.find({ createdBy: recruiterProfile._id });

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

  const job = await Job.findById(jobId).select('+embedding');
  if (!job) return next(new AppError('No job found with that ID', 404));

  job.jobStatus = normalizeStatus(jobStatus);

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
  const jobs = await Job.find().populate({
    path: 'createdBy',
    populate: { path: 'user', select: 'name email' },
  });

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
  const job = await Job.findById(jobId);
  if (!job) return next(new AppError('Job not found', 404));

  // 3. Only active jobs
  if (job.jobStatus !== 'Active')
    return next(
      new AppError('This job is no longer accepting applications', 400),
    );

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

  const applicantsWithMatch = await Promise.all(
    job.applicants.map(async (entry) => {
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

      return {
        _id: entry._id,
        status: entry.status,
        appliedAt: entry.appliedAt,
        candidate,
        matchPercent,
        matchLabel,
      };
    }),
  );

  // Sort by matchPercent descending — highest match first
  applicantsWithMatch.sort(
    (a, b) => (b.matchPercent ?? 0) - (a.matchPercent ?? 0),
  );

  res.status(200).json({
    status: 'success',
    totalApplicants: job.applicants.length,
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

  const appliedJobs = populated.appliedJobs.map((entry) => {
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

  res.status(200).json({
    status: 'success',
    data: { hasApplied },
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

    // ─── FIX: Fetch ALL jobs (both Active and Closed), not just Active.
    // We score every job, then split into active (fully shown) and
    // closed (shown as disabled). Both must pass the 60% threshold.
    const allJobs = await Job.find()
      .select('+embedding')
      .populate('createdBy', 'name email')
      .lean();

    console.log(`[Recommended] Total jobs in DB: ${allJobs.length}`);
    console.log(
      `[Recommended] Jobs with embeddings: ${allJobs.filter((j) => j.embedding?.length > 0).length}`,
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
      // Keep jobs above 60% threshold regardless of status
      .filter((job) => job.matchPercent > 60)
      // Active jobs first, then closed — within each group sort by match %
      .sort((a, b) => {
        const aActive = a.jobStatus === 'Active' ? 1 : 0;
        const bActive = b.jobStatus === 'Active' ? 1 : 0;
        if (bActive !== aActive) return bActive - aActive;
        return b.matchPercent - a.matchPercent;
      });

    console.log(
      `[Recommended] Jobs passing 60% threshold: ${scoredJobs.length}`,
    );
    console.log(
      `[Recommended] Active: ${scoredJobs.filter((j) => j.jobStatus === 'Active').length}, Closed: ${scoredJobs.filter((j) => j.jobStatus !== 'Active').length}`,
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

  const activeJobs = jobs.filter((j) => j.jobStatus === 'Active').length;

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

  // Flatten all applicants across all jobs, attach job info
  const allApplicants = [];

  for (const job of jobs) {
    for (const entry of job.applicants) {
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
      });
    }
  }

  res.status(200).json({
    status: 'success',
    totalCandidates: allApplicants.length,
    data: { applicants: allApplicants },
  });
});

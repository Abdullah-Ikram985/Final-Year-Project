const MockInterview = require('../models/mockInterviewSchema');
const Job = require('../models/jobSchema');
const CandidateProfile = require('../models/candidateProfileSchema');
const RecruiterProfile = require('../models/recruiterProfileSchema');
const AppError = require('../utils/appError');
const checkAsync = require('../utils/checkAsync');
const mockInterviewService = require('../services/mockInterviewService');

/**
 * Start a new AI Mock Interview session for a specific ACTIVE job.
 * POST /api/v1/mock-interviews/start
 */
const startMockInterview = checkAsync(async (req, res, next) => {
  const { jobId } = req.body;

  if (!jobId) {
    return next(new AppError('Please provide a valid jobId to start an interview', 400));
  }

  // 1. Validate Job existence and active status
  const job = await Job.findById(jobId);
  if (!job) {
    return next(new AppError('Job posting not found', 404));
  }

  if (job.jobStatus && job.jobStatus.toLowerCase() !== 'active') {
    return next(
      new AppError(
        'Mock interviews can only be conducted for Active job postings.',
        400,
      ),
    );
  }

  // 2. Fetch candidate profile if available
  const candidateProfile = await CandidateProfile.findOne({ user: req.user.id });

  // 3. Generate 5 job-specific interview questions
  const questions = await mockInterviewService.generateJobQuestions(
    job,
    candidateProfile,
  );

  // 4. Create new interview session
  const interview = await MockInterview.create({
    candidate: req.user.id,
    job: job._id,
    questions,
    answers: [],
    status: 'in_progress',
  });

  res.status(201).json({
    success: true,
    message: 'AI Mock Interview session started successfully.',
    data: {
      interviewId: interview._id,
      jobId: job._id,
      jobTitle: job.title,
      department: job.department,
      location: job.location,
      questions: interview.questions.map((q) => ({
        questionId: q.questionId,
        question: q.question,
        questionType: q.questionType,
      })),
    },
  });
});

/**
 * Submit an answer for a specific question in the interview session.
 * POST /api/v1/mock-interviews/:interviewId/answer
 */
const submitAnswer = checkAsync(async (req, res, next) => {
  const { interviewId } = req.params;
  const { questionId, answer } = req.body;

  if (!questionId || !answer || !answer.trim()) {
    return next(
      new AppError('Please provide both questionId and a non-empty answer', 400),
    );
  }

  // 1. Find interview session and verify candidate ownership
  const interview = await MockInterview.findById(interviewId).populate('job');
  if (!interview) {
    return next(new AppError('Mock interview session not found', 404));
  }

  if (interview.candidate.toString() !== req.user.id.toString()) {
    return next(
      new AppError('You do not have permission to access this interview session', 403),
    );
  }

  if (interview.status === 'completed') {
    return next(
      new AppError('This interview session has already been completed.', 400),
    );
  }

  // 2. Locate the question
  const targetQuestion = interview.questions.find(
    (q) => q.questionId === questionId || q._id?.toString() === questionId,
  );

  if (!targetQuestion) {
    return next(new AppError('Question not found in this interview session', 404));
  }

  // 3. Fetch candidate profile for context
  const candidateProfile = await CandidateProfile.findOne({ user: req.user.id });

  // 4. Evaluate answer via AI service
  const evaluation = await mockInterviewService.evaluateAnswer(
    interview.job,
    candidateProfile,
    targetQuestion.question,
    answer.trim(),
    targetQuestion.questionType,
  );

  // 5. Store / update answer in session
  const existingAnswerIdx = interview.answers.findIndex(
    (a) => a.questionId === questionId,
  );

  const answerPayload = {
    questionId,
    question: targetQuestion.question,
    answer: answer.trim(),
    score: evaluation.score,
    relevance: evaluation.relevance,
    technicalCorrectness: evaluation.technicalCorrectness,
    completeness: evaluation.completeness,
    clarity: evaluation.clarity,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    answeredAt: new Date(),
  };

  if (existingAnswerIdx >= 0) {
    interview.answers[existingAnswerIdx] = answerPayload;
  } else {
    interview.answers.push(answerPayload);
  }

  await interview.save();

  res.status(200).json({
    success: true,
    message: 'Answer evaluated successfully.',
    data: {
      questionId,
      score: evaluation.score,
      feedback: {
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        relevance: evaluation.relevance,
        technicalCorrectness: evaluation.technicalCorrectness,
        completeness: evaluation.completeness,
        clarity: evaluation.clarity,
      },
      answeredCount: interview.answers.length,
      totalQuestions: interview.questions.length,
    },
  });
});

/**
 * Complete the interview session and calculate the overall Readiness Score.
 * POST /api/v1/mock-interviews/:interviewId/complete
 */
const completeMockInterview = checkAsync(async (req, res, next) => {
  const { interviewId } = req.params;

  const interview = await MockInterview.findById(interviewId).populate('job');
  if (!interview) {
    return next(new AppError('Mock interview session not found', 404));
  }

  if (interview.candidate.toString() !== req.user.id.toString()) {
    return next(
      new AppError('You do not have permission to access this interview session', 403),
    );
  }

  if (interview.answers.length === 0) {
    return next(
      new AppError(
        'Cannot complete an interview session with zero answered questions.',
        400,
      ),
    );
  }

  // 1. Fetch candidate profile
  const candidateProfile = await CandidateProfile.findOne({ user: req.user.id });

  // 2. Generate final readiness report
  const report = await mockInterviewService.generateFinalReadinessReport(
    interview.job,
    candidateProfile,
    interview.answers,
  );

  // 3. Update session
  interview.overallReadinessScore = report.readinessScore;
  interview.breakdown = report.breakdown;
  interview.strengths = report.strengths;
  interview.areasToImprove = report.areasToImprove;
  interview.recommendation = report.recommendation;
  interview.status = 'completed';
  interview.completedAt = new Date();

  await interview.save();

  res.status(200).json({
    success: true,
    message: 'Interview completed successfully.',
    data: {
      interviewId: interview._id,
      jobTitle: interview.job?.title,
      readinessScore: report.readinessScore,
      breakdown: report.breakdown,
      strengths: report.strengths,
      areasToImprove: report.areasToImprove,
      recommendation: report.recommendation,
      completedAt: interview.completedAt,
    },
  });
});

/**
 * Get details of a specific interview session.
 * GET /api/v1/mock-interviews/:interviewId
 */
const getInterviewDetail = checkAsync(async (req, res, next) => {
  const { interviewId } = req.params;

  const interview = await MockInterview.findById(interviewId)
    .populate('job', 'title department location skills jobType')
    .lean();

  if (!interview) {
    return next(new AppError('Mock interview session not found', 404));
  }

  if (interview.candidate.toString() !== req.user.id.toString()) {
    return next(
      new AppError('You do not have permission to view this interview session', 403),
    );
  }

  res.status(200).json({
    success: true,
    data: {
      interview,
    },
  });
});

/**
 * Recruiter views candidate's completed mock interview report for their specific job.
 * GET /api/v1/mock-interviews/recruiter/:candidateId/:jobId
 */
const getRecruiterCandidateInterview = checkAsync(async (req, res, next) => {
  const { candidateId, jobId } = req.params;

  // 1. Verify recruiter profile
  const recruiterProfile = await RecruiterProfile.findOne({
    user: req.user.id,
  });
  if (!recruiterProfile) {
    return next(new AppError('Recruiter profile not found', 404));
  }

  // 2. Verify job ownership
  const job = await Job.findById(jobId);
  if (!job) {
    return next(new AppError('Job not found', 404));
  }

  if (job.createdBy.toString() !== recruiterProfile._id.toString()) {
    return next(
      new AppError(
        'You do not have permission to view interviews for this job',
        403,
      ),
    );
  }

  // 3. Resolve candidate User ID (whether candidateId passed is User._id or CandidateProfile._id)
  let candidateUserId = candidateId;
  const candidateProfile = await CandidateProfile.findById(candidateId);
  if (candidateProfile) {
    candidateUserId = candidateProfile.user;
  }

  // 4. Find the completed MockInterview for this candidate and job
  const completedInterview = await MockInterview.findOne({
    candidate: candidateUserId,
    job: jobId,
    status: 'completed',
  }).lean();

  if (!completedInterview) {
    return res.status(200).json({
      status: 'success',
      data: {
        completed: false,
      },
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      completed: true,
      overallReadinessScore: completedInterview.overallReadinessScore,
      breakdown: completedInterview.breakdown,
      strengths: completedInterview.strengths,
      areasToImprove: completedInterview.areasToImprove,
      recommendation: completedInterview.recommendation,
      answers: completedInterview.answers,
      completedAt: completedInterview.completedAt,
    },
  });
});

/**
 * Platform-wide AI Mock Interview analytics for Admin.
 * Uses MongoDB aggregation to compute stats directly from stored records.
 * Zero LLM / AI calls made.
 * GET /api/v1/mock-interviews/admin/analytics
 */
const getAdminInterviewAnalytics = checkAsync(async (req, res, next) => {
  const [countsByStatus, averagesAndDistribution] = await Promise.all([
    // 1. Group counts by status
    MockInterview.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // 2. Compute averages & readiness distribution across completed interviews
    MockInterview.aggregate([
      {
        $match: { status: 'completed' },
      },
      {
        $group: {
          _id: null,
          totalCompleted: { $sum: 1 },
          avgReadiness: { $avg: '$overallReadinessScore' },
          avgTech: { $avg: '$breakdown.technicalKnowledge' },
          avgComm: { $avg: '$breakdown.communication' },
          avgRelevance: { $avg: '$breakdown.jobRelevance' },
          avgQuality: { $avg: '$breakdown.answerQuality' },
          highReadiness: {
            $sum: {
              $cond: [{ $gte: ['$overallReadinessScore', 80] }, 1, 0],
            },
          },
          moderateReadiness: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$overallReadinessScore', 60] },
                    { $lt: ['$overallReadinessScore', 80] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          needsImprovement: {
            $sum: {
              $cond: [{ $lt: ['$overallReadinessScore', 60] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  let totalInterviews = 0;
  let completedInterviews = 0;
  let inProgressInterviews = 0;
  let abandonedInterviews = 0;

  countsByStatus.forEach((item) => {
    totalInterviews += item.count;
    if (item._id === 'completed') completedInterviews = item.count;
    else if (item._id === 'in_progress') inProgressInterviews = item.count;
    else if (item._id === 'abandoned') abandonedInterviews = item.count;
  });

  const completionRate =
    totalInterviews > 0
      ? Math.round((completedInterviews / totalInterviews) * 100)
      : 0;

  const stats = averagesAndDistribution[0] || {};

  const responseData = {
    totalInterviews,
    completedInterviews,
    inProgressInterviews,
    abandonedInterviews,
    completionRate,
    averageReadinessScore: Math.round(stats.avgReadiness || 0),
    averageTechnicalKnowledge: Math.round(stats.avgTech || 0),
    averageCommunication: Math.round(stats.avgComm || 0),
    averageJobRelevance: Math.round(stats.avgRelevance || 0),
    averageAnswerQuality: Math.round(stats.avgQuality || 0),
    readinessDistribution: {
      high: stats.highReadiness || 0,
      moderate: stats.moderateReadiness || 0,
      needsImprovement: stats.needsImprovement || 0,
    },
  };

  res.status(200).json({
    status: 'success',
    data: responseData,
  });
});

module.exports = {
  startMockInterview,
  submitAnswer,
  completeMockInterview,
  getInterviewDetail,
  getRecruiterCandidateInterview,
  getAdminInterviewAnalytics,
};

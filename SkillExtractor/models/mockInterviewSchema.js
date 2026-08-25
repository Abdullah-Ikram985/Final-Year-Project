const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Interview must belong to a candidate user'],
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Interview must be associated with a specific job'],
    },
    questions: [
      {
        questionId: {
          type: String,
          required: true,
        },
        question: {
          type: String,
          required: true,
        },
        questionType: {
          type: String,
          enum: ['technical', 'domain', 'experience', 'behavioral'],
          default: 'technical',
        },
      },
    ],
    answers: [
      {
        questionId: {
          type: String,
          required: true,
        },
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          min: 0,
          max: 100,
        },
        relevance: {
          type: Number,
          min: 0,
          max: 100,
        },
        technicalCorrectness: {
          type: Number,
          min: 0,
          max: 100,
        },
        completeness: {
          type: Number,
          min: 0,
          max: 100,
        },
        clarity: {
          type: Number,
          min: 0,
          max: 100,
        },
        strengths: [String],
        improvements: [String],
        answeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    overallReadinessScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    breakdown: {
      technicalKnowledge: { type: Number, min: 0, max: 100 },
      communication: { type: Number, min: 0, max: 100 },
      jobRelevance: { type: Number, min: 0, max: 100 },
      answerQuality: { type: Number, min: 0, max: 100 },
    },
    strengths: [String],
    areasToImprove: [String],
    recommendation: String,
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  },
);

// Compound index for fast candidate session queries
mockInterviewSchema.index({ candidate: 1, job: 1, createdAt: -1 });

const MockInterview = mongoose.model('MockInterview', mockInterviewSchema);
module.exports = MockInterview;

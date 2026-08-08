const mongoose = require('mongoose');

const careerRoadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    careerInsight: {
      domain: String,
      summary: String,
    },
    targetRoles: [
      {
        role: String,
        matchPercent: Number,
        whyThisRole: String,
        missingSkills: [
          {
            skill: String,
            priority: {
              type: String,
              enum: ['HIGH', 'MEDIUM', 'LOW'],
            },
          },
        ],
      },
    ],
    learningRoadmap: [
      {
        skill: String,
        priority: {
          type: String,
          enum: ['HIGH', 'MEDIUM', 'LOW'],
        },
        courses: [
          {
            title: String,
            platform: {
              type: String,
              enum: ['Udemy', 'Coursera', 'edX'],
            },
            duration: String,
            level: {
              type: String,
              enum: ['Beginner', 'Intermediate', 'Advanced'],
            },
            urlHint: String,
          },
        ],
      },
    ],
    overallRecommendation: {
      bestRole: String,
      reason: String,
      nextStep: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('CareerRoadmap', careerRoadmapSchema);

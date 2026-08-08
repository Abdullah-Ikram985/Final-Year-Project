const mongoose = require('mongoose');

const candidateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: String,
    institution: String,

    phoneNumber: String,
    location: String,

    linkedinProfileLink: String,
    personalWebsiteLink: String,

    skills: [String],

    professionalBio: String,

    experience: [
      {
        title: String,
        company: String,
        duration: String,
      },
    ],

    education: [
      {
        degree: String,
        institution: String,
        year: String,
      },
    ],

    preferredRole: String,
    preferredType: String,
    expectedSalary: Number,

    pdfUrl: String,

    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    appliedJobs: [
      {
        job: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Job',
          required: true,
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
          default: 'pending',
        },
      },
    ],

    profileView: { type: Number, default: 0 },
  },

  {
    timestamps: true,
  },
);

const CandidateProfile = mongoose.model(
  'CandidateProfile',
  candidateProfileSchema,
);
module.exports = CandidateProfile;

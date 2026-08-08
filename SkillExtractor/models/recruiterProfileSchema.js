const mongoose = require('mongoose');
const recruiterProfileSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ✅ Already have these — keep them
    companyName: String,
    companyWebsite: String,
    companySize: String,
    industry: String,
    designation: String,

    // ✅ Add these
    phoneNumber: String, // recruiter's contact number
    location: String, // company location / city
    companyLogoUrl: String, // company logo image
    linkedinProfileLink: String, // recruiter's LinkedIn
    professionalBio: String, // short recruiter bio

    // ✅ Track activity
    profileView: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const RecruiterProfile = mongoose.model(
  'RecruiterProfile',
  recruiterProfileSchema,
);
module.exports = RecruiterProfile;

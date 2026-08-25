const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'job_approved',
        'job_rejected',
        'application_submitted',
        'application_received',
        'application_status_updated',
        'application_reviewed',
        'application_shortlisted',
        'application_rejected',
        'general',
      ],
      default: 'general',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    candidateProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
    },
    candidateProfiles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CandidateProfile',
      },
    ],
    candidateNames: [
      {
        type: String,
      },
    ],
    applicantCount: {
      type: Number,
      default: 1,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;

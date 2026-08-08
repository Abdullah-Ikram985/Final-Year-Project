const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruiterProfile',
    },
    title: {
      type: String,
    },
    department: {
      type: String,
    },
    location: {
      type: String,
    },
    salary: {
      type: Number,
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Visiting', 'Remote'],
    },
    skills: {
      type: [String],
    },

    description: {
      type: String,
    },
    jobStatus: {
      type: 'String',
      enum: ['Active', 'Closed', 'Draft'],
      default: 'Active',
    },
    embedding: {
      type: [Number],
      select: false,
    },
    applicants: [
      {
        candidate: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'CandidateProfile',
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
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  },
);

jobSchema.post('save', async function (doc) {
  try {
    if (doc.embedding && doc.embedding.length > 0) return;

    const { buildJobText, generateEmbedding } = require('../utils/embedding');

    const text = buildJobText(doc);
    const embedding = await generateEmbedding(text);

    await mongoose.model('Job').findByIdAndUpdate(doc._id, {
      embedding,
    });
  } catch (err) {
    console.error('Embedding failed:', err.message);
  }
});

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;

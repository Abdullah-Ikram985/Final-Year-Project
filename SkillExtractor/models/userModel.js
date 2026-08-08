const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: function () {
//       return this.provider === 'local';
//     },
//   },
//   title: {
//     type: String,
//     default: '',
//   },
//   institution: { type: String, default: '' },
//   matchScore: { type: Number, default: 0 },
//   profileInitials: {
//     type: String,
//     default: function () {
//       return (
//         this.name
//           ?.split(' ')
//           .map((word) => word[0])
//           .join('')
//           .toUpperCase() || ''
//       );
//     },
//   },
//   email: {
//     type: String,
//     unique: true,
//     required: [true, 'Please provide your email'],
//     lowercase: true,
//     validate: [validator.isEmail, 'Please provide a valid email'],
//   },

//   password: {
//     type: String,
//     minlength: 8,
//     select: false,
//     required: function () {
//       return this.provider === 'local';
//     },
//   },

//   passwordChangeAt: {
//     type: Date,
//     select: false,
//   },

//   passwordResetToken: {
//     type: String,
//     select: false,
//   },
//   passwordResetExpires: {
//     type: Date,
//     select: false,
//   },

//   fcmToken: {
//     type: String,
//   },

//   role: {
//     type: String,
//     enum: ['candidate', 'recruiter', 'admin'],
//   },
//   pdfUrl: { type: String },
//   imageUrl: { type: String },
//   department: { type: String },
//   phoneNumber: { type: String },
//   location: { type: String },
//   linkedinProfileLink: { type: String },
//   personalWebsiteLink: { type: String },
//   skills: {
//     type: [String],
//     default: [],
//   },
//   professionalBio: {
//     type: String,
//     default: '',
//     trim: true,
//     maxlength: 500,
//     validate: {
//       validator: function (value) {
//         return value.length <= 500;
//       },
//       message: 'Bio cannot exceed 500 characters',
//     },
//   },
//   jobPreferredRole: {
//     type: String,
//     default: '',
//   },
//   jobPreferredSubject: {
//     type: String,
//     default: '',
//   },
//   jobPreferredType: {
//     type: String,
//     enum: ['Full Time', 'Part Time', 'Remote'],
//   },
//   jobPreferredExpectedSalary: {
//     type: Number,
//     default: 0,
//   },
//   applications: {
//     type: Number,
//     default: 0,
//   },
//   savedJobs: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Job',
//     },
//   ],
//   profileViews: { type: Number, default: 0 },
//   __v: {
//     type: Number,
//     select: false,
//   },
// });

const userSchema = new mongoose.Schema(
  {
    name: { type: String },

    email: {
      type: String,
      unique: true,
      required: [true, 'Please provide your email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    profileInitials: {
      type: String,
      default: function () {
        return (
          this.name
            ?.split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase() || ''
        );
      },
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
      required: function () {
        return this.provider === 'local';
      },
    },

    passwordChangeAt: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    fcmToken: {
      type: String,
    },

    role: {
      type: String,
      enum: ['candidate', 'recruiter', 'admin'],
    },

    imageUrl: String,
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || !this.isNew) return next();

  this.passwordChangeAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  const result = await bcrypt.compare(candidatePassword, userPassword);
  return result;
};

userSchema.methods.changePasswordAfter = function (JwtIssuesTime) {
  if (this.passwordChangeAt) {
    const changePasswordTime = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10,
    );
    return JwtIssuesTime < changePasswordTime;
  }
  return false;
};

// PASSWORD RESET TOKEN
userSchema.methods.createPasswordResetToken = function () {
  const userToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(userToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // TOKEN WILL BE EXPIRED AFTER 10 minutes

  return userToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;

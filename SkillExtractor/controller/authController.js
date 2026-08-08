const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

const checkAsync = require('../utils/checkAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const sendEmail = require('../utils/email');

const CandidateProfile = require('../models/candidateProfileSchema');
const RecruiterProfile = require('../models/recruiterProfileSchema');

const siginToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRE_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = siginToken(user.id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

// ======= Signup =======
exports.signup = checkAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  console.log('Signup => ');
  if (!name || !email || !password || !role)
    return next(new AppError('Some required keys are missing ', 400));

  const newUser = await User.create({
    name: name,
    email: email,
    password: password,
    role: role,
  });

  if (role === 'candidate') {
    await CandidateProfile.create({
      user: newUser._id,
    });
  }

  if (role === 'recruiter') {
    await RecruiterProfile.create({
      user: newUser._id,
    });
  }
  console.log('New User =>', newUser);

  createSendToken(newUser, 201, res);
});

// ======== Login =======

exports.login = checkAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email }).select('+password');

  if (!email || !password) {
    return next(new AppError('Please enter email and password', 400));
  }
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

// ======= Protect our Routes =======

exports.protect = checkAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  /* For cookies
    else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
    */
  if (!token) {
    return next(
      new AppError('You are not logged in! Please login to get access', 401),
    );
  }

  // VERIFICATION TOKEN
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // CHECK IF USER STILL EXSIST
  const currentUser = await User.findById(decode.id);

  if (!currentUser) {
    return next(
      new AppError('User belong this token does no longer exsist!', 401),
    );
  }

  //CHECK IF USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUSES

  if (currentUser.changePasswordAfter(decode.iat)) {
    return next(
      new AppError('User recently changed password! Please login again', 401),
    );
  }
  req.user = currentUser;

  next();
});

// ====== Forgot Password ======

exports.forgotPassword = checkAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email!', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resettUrl = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a patch request with your new password to ${resettUrl} If you did not forgot your pasword please ignore this email`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Your password reset token(valid for 10 min)`,
      message,
    });
    res.status(200).json({
      status: 'success',
      resetToken: resetToken,
      message:
        'Password reset request received. You can now reset your password.',
    });
  } catch (err) {
    console.log('💥', err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

// ======= Reset Password =======

exports.resetPassword = checkAsync(async (req, res, next) => {
  // Get user based on the token
  const hashToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // If token is not expired and there is user set the new passwpord
  user.password = req.body.password;
  // user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // Update changepasswordAt property  for the user
  // ====> check the userModel file
  // Log the user in and  send jason web token

  res.status(200).json({
    status: 'success',
    message: 'Password update succesfully!',
  });
});

// ====== Update Password ========
exports.updatePassword = checkAsync(async (req, res, next) => {
  // 1)Get user form collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check the POSTED password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your Current password is wrong', 401));
  }

  user.password = req.body.password;

  await user.save();

  createSendToken(user, 201, res);
});

// =============> Restrict Routes

exports.restrictTo = (...role) => {
  console.log('ROles', role);
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return next(
        new AppError('You have no permission to perforn this action', 403),
      );
    }
    next();
  };
};

// exports.logout = checkAsync(async (req, res, next) => {
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   }
//   const user = req.user;

//   const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET, {
//     expiresIn: process.env.EXPIRE_IN,
//   });
//   //  decode.exp:Date.now()
//   console.log(decode.exp);
//   res.status(200).json({
//     status: 'success',
//     message: 'Successfully Logout!',
//   });
// });

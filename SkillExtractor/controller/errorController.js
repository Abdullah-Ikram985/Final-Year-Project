const AppError = require('../utils/appError');

const sendErrorDev = (err, req, res) => {
  // Api
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // OPERATIONA ERROR, TRUSTED ERROR : SEND MESSAGE TO THE CLIENT
    if (err.isOperational) {
      console.log('💥 Operational 💥', err);
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // PROGRAMMING ERROR OR OTHER UNKNOWN ERROR: DO NOT LEAK ERROR DETAIL
    console.log('Error 💥', err);
    // SEND GENERIS MESSAGE
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
 

  // PROGRAMMING ERROR OR OTHER UNKNOWN ERROR: DO NOT LEAK ERROR DETAIL
  console.log('Error 💥', err);
  return res.status(500).render('error', {
    status: err.status,
    message: 'Please try again later!',
  });
};

const handleCastErrorDB = (err) => {
  // Get the field name from the error object
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  // Dynamic message
  const message = `The ${field} "${value}" is already taken. Please use another one.`;
  return new AppError(message, 400);
};

const handleJWTExpiredError = (err) =>
  new AppError('Invalid Token please login again!', 401);
const JwtExpireErr = (err) =>
  new AppError('Your token expired Please login again!', 401);



module.exports = (err, req, res, next) => {
  console.log(err);
  console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // let error = { ...err };
    let error = {
      ...err,
      message: err.message,
      name: err.name,
      stack: err.stack,
    };
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'ValidationError') error = handleValidatorError(error);
    if (error.code === 11000) error = handleCastErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTExpiredError();
    if (error.name === 'TokenExpiredError') error = JwtExpireErr();
    sendErrorProd(error, req, res);
  }
};

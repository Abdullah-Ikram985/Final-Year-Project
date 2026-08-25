const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });
const cors = require('cors');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const profileRouter = require('./routes/fileRoutes');
const jobRouter = require('./routes/jobRoutes');
const candidateRouter = require('./routes/candidateRoutes');
const recruiterRouter = require('./routes/recruiterRoutes');
const resumeRouter = require('./routes/resumeRoutes');
const notificationRouter = require('./routes/notificationRoutes');
const mockInterviewRouter = require('./routes/mockInterviewRoutes');

const firebase = require('./firebase/index');

const app = express();
app.use(cors());

app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    express.urlencoded({ extended: true })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// API ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/files', profileRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/resume', resumeRouter);
app.use('/api/v1/candidate', candidateRouter);
app.use('/api/v1/recruiter', recruiterRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/mock-interviews', mockInterviewRouter);

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.all('*', (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on the server!`, 400));
});

app.use(globalErrorHandler);
console.log('😂', process.env.NODE_ENV);

module.exports = app;

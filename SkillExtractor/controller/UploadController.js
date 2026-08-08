const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const CandidateProfile = require('../models/candidateProfileSchema');

const multerStorage = multer.memoryStorage();

// Generic file filter
const multerFilter = (type) => (req, file, cb) => {
  if (type === 'image' && file.mimetype.startsWith('image')) {
    cb(null, true);
  } else if (type === 'pdf' && file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Only ${type}s allowed!`, 400), false);
  }
};

// Create multer upload handlers
exports.uploadImage = multer({
  storage: multerStorage,
  fileFilter: multerFilter('image'),
}).single('photo');
exports.uploadPDF = multer({
  storage: multerStorage,
  fileFilter: multerFilter('pdf'),
}).single('pdf');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// Generic upload function
exports.uploadToCloudinary =
  (folder, resource_type = 'image') =>
  (req, res, next) => {
    if (!req.file) return next(new AppError('No file uploaded', 400));

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
        use_filename: true,
        upload_preset: 'public_raw_upload',
        // unique_filename: true,
        format: resource_type === 'raw' ? 'pdf' : undefined,
      },

      async (err, result) => {
        try {
          if (err) {
            return next(new AppError('Upload failed', 500));
          }
          // console.log('Pdf Url  =>', result);

          if (resource_type === 'image') {
            await User.findByIdAndUpdate(req.user.id, {
              imageUrl: result.secure_url,
            });
          }

          if (resource_type === 'raw') {
            
            const profile = await CandidateProfile.findOne({
              user: req.user.id,
            });

            if (!profile) {
              return next(new AppError('Candidate profile not found', 404));
            }

            profile.pdfUrl = result.secure_url;
            await profile.save();
          }

          // if (!user) {
          //   return next(new AppError('User not found', 404));
          // }

          res.status(200).json({
            status: 'success',
            data: {
              // user,
              url: result.secure_url,
              public_id: result.public_id,
            },
          });
        } catch (error) {
          return next(
            new AppError('File upload failed. Please try again.', 500),
          );
        }
      },
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  };

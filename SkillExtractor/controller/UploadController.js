// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');
// const streamifier = require('streamifier');

// const User = require('../models/userModel');
// const AppError = require('../utils/appError');
// const CandidateProfile = require('../models/candidateProfileSchema');

// const multerStorage = multer.memoryStorage();

// // Generic file filter
// const multerFilter = (type) => (req, file, cb) => {
//   if (type === 'image' && file.mimetype.startsWith('image')) {
//     cb(null, true);
//   } else if (type === 'pdf' && file.mimetype === 'application/pdf') {
//     cb(null, true);
//   } else {
//     cb(new AppError(`Invalid file type. Only ${type}s allowed!`, 400), false);
//   }
// };

// // Create multer upload handlers
// exports.uploadImage = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter('image'),
// }).single('photo');
// exports.uploadPDF = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter('pdf'),
// }).single('pdf');

// // Cloudinary config
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });
// // console.log({
// //   cloudName: process.env.CLOUDINARY_CLOUD_NAME,
// //   apiKey: process.env.CLOUDINARY_API_KEY,
// //   hasApiSecret: Boolean(process.env.CLOUDINARY_API_SECRET),
// // });

// // Generic upload function
// exports.uploadToCloudinary =
//   (folder, resource_type = 'image') =>
//   (req, res, next) => {
//     if (!req.file) return next(new AppError('No file uploaded', 400));

//     const uploadStream = cloudinary.uploader.upload_stream(
//       {
//         folder,
//         resource_type,
//         use_filename: true,
//         upload_preset: 'public_raw_upload',
//         // unique_filename: true,
//         format: resource_type === 'raw' ? 'pdf' : undefined,
//       },

//       async (err, result) => {
//         try {
//           if (err) {
//             return next(new AppError('Upload failed', 500));
//           }
//           if (resource_type === 'image') {
//             await User.findByIdAndUpdate(req.user.id, {
//               imageUrl: result.secure_url,
//             });
//           }

//           if (resource_type === 'raw') {
//             const profile = await CandidateProfile.findOne({
//               user: req.user.id,
//             });

//             if (!profile) {
//               return next(new AppError('Candidate profile not found', 404));
//             }

//             profile.pdfUrl = result.secure_url;
//             await profile.save();
//           }

//           // if (!user) {
//           //   return next(new AppError('User not found', 404));
//           // }

//           res.status(200).json({
//             status: 'success',
//             data: {
//               // user,
//               url: result.secure_url,
//               public_id: result.public_id,
//             },
//           });
//         } catch (error) {
//           return next(
//             new AppError('File upload failed. Please try again.', 500),
//           );
//         }
//       },
//     );

//     streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
//   };

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const CandidateProfile = require('../models/candidateProfileSchema');

// ---------- Multer (files are kept in memory as req.file.buffer) ----------
const multerStorage = multer.memoryStorage();

const multerFilter = (type) => (req, file, cb) => {
  if (type === 'image' && file.mimetype.startsWith('image')) {
    cb(null, true);
  } else if (type === 'pdf' && file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Only ${type}s allowed!`, 400), false);
  }
};

// Form field name must be exactly "photo"
exports.uploadImage = multer({
  storage: multerStorage,
  fileFilter: multerFilter('image'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('photo');

// Form field name must be exactly "pdf"
exports.uploadPDF = multer({
  storage: multerStorage,
  fileFilter: multerFilter('pdf'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single('pdf');

// ---------- Cloudinary config ----------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------- Upload middleware ----------
// Usage: uploadToCloudinary('resumes', 'raw')  or  uploadToCloudinary('profile-photos', 'image')
exports.uploadToCloudinary =
  (folder, resource_type = 'image') =>
  (req, res, next) => {
    if (!req.file) return next(new AppError('No file uploaded', 400));

    const options = {
      folder,
      resource_type,
    };

    if (resource_type === 'raw') {
      // Raw files are not processed, so the extension must be part of public_id
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      options.public_id = `${Date.now()}-${safeName}`;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      async (err, result) => {
        if (err) {
          console.error('Cloudinary error:', err);
          return next(
            new AppError(`Upload failed: ${err.message || 'Unknown error'}`, 500),
          );
        }

        try {
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

          res.status(200).json({
            status: 'success',
            data: {
              url: result.secure_url,
              public_id: result.public_id,
            },
          });
        } catch (error) {
          console.error('Post-upload error:', error);
          return next(
            new AppError('File upload failed. Please try again.', 500),
          );
        }
      },
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  };
const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  image: String,
  description: String,
  categories: {
    type: [String],
  },

  __v: {
    type: Number,
    select: false,
  },
});

const SingleImgUpload = mongoose.model('SingleImgUpload', userProfileSchema);

module.exports = SingleImgUpload;

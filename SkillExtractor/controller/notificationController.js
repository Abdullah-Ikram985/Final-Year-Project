const Notification = require('../models/notificationSchema');
const checkAsync = require('../utils/checkAsync');
const AppError = require('../utils/appError');

exports.getMyNotifications = checkAsync(async (req, res, next) => {
  const notifications = await Notification.find({
    recipient: req.user._id,
  })
    .populate('jobId', 'title department location jobStatus')
    .populate({
      path: 'candidateProfileId',
      select: 'title institution skills user',
      populate: { path: 'user', select: 'name email imageUrl' },
    })
    .populate({
      path: 'candidateProfiles',
      select: 'title institution skills user',
      populate: { path: 'user', select: 'name email imageUrl' },
    })
    .sort({ isRead: 1, createdAt: -1 });

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    status: 'success',
    totalNotifications: notifications.length,
    unreadCount,
    data: {
      notifications,
      unreadCount,
    },
  });
});

exports.markAsRead = checkAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true },
  );

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      notification,
    },
  });
});

exports.markAllAsRead = checkAsync(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true },
  );

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read',
  });
});

exports.deleteNotification = checkAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

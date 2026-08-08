const express = require("express");
const router = express.Router();
const sendPushNotification = require("../utils/sendPush");
const authController = require("../controller/authController");
const User = require("../models/userModel");

router.post("/send-fcm-noti", async (req, res) => {
  const { userId } = req.params.id;

  const user = await User.findById(userId);
  if (!user?.fcmToken) {
    return res.status(400).json({ message: "User has no FCM token" });
  }

  await sendPushNotification(
    "dWcBkDu5vk0yuAS86MHbe3:APA91bFyl76U0Mo_YY6lPTCjLag3qoTUbxwJ2uO8iwXErBLM5121KFxhTL0DzCwXJRa4wAKLkLxPdpXNXnj-7vgOMUeMpHBLAgx379kECNa6JN2iU55riYw"
  );

  res.json({ success: true, data: user });
});

module.exports = router;

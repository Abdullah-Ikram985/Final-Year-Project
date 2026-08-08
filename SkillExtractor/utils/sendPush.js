const firebase = require('../firebase/index');

async function sendPushNotification(token, title, description) {
  const message = {
    token,
    notification: {
      title: `${title}`,
      body: `🎉 Hey! You’ve been invited to join an exciting new group. Don’t miss out!`,
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };
  console.log('Message 👍', message);
  try {
    const response = await firebase.messaging().send(message);
    console.log('Notification sent:', response);
  } catch (error) {
    console.error('Push error:', error);
  }
}

module.exports = sendPushNotification;

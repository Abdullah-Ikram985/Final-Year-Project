const firebase = require('firebase-admin');

const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (base64) {
  const serviceAccount = JSON.parse(
    Buffer.from(base64, 'base64').toString('utf8')
  );
  firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
  });
  module.exports = firebase;
} else {
  // Push notifications disabled when FIREBASE_SERVICE_ACCOUNT_BASE64 is not set (e.g. server config.env).
  module.exports = {
    messaging: () => ({
      send: async () => {
        console.warn('Firebase not configured; push notification skipped.');
      },
    }),
  };
}

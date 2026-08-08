const appleSignin = require("apple-signin-auth");

const verifyAppleIdentityToken = async (identityToken) => {
  return appleSignin.verifyIdToken(identityToken, {
    audience: "com.nodemobileapp",
    ignoreExpiration: false,
  });
};

module.exports = verifyAppleIdentityToken;

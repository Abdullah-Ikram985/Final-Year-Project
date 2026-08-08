const express = require("express");
const { loginWithGoogle } = require("../controller/loginWithGoogle");
const router = express.Router();

router.post("/google", loginWithGoogle);

module.exports = router;

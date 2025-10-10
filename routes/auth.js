const authController = require('../controller/auth')
const authMiddleware = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
router.post('/auth/login', authController.userLogin);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.post("/auth/google-login", authController.googleLogin);

// user profile image edit
router.get("/profile", authMiddleware, authController.getUserProfile);
router.put("/profile-edit", authMiddleware, authController.updateUserProfile);

router.post("/change-password", authMiddleware, authController.changePassword);

exports.router = router;
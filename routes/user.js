const express = require('express');
const router = express.Router();
const userController = require('../controller/user');

router.post('/register', userController.registerUser); 
router.get('/view-user', userController.getAllUser); 
router.get('/view-user-profile', userController.viewProfile);
router.get("/view-user-profile/:id",  userController.viewProfile);
router.delete('/delete-user/:id', userController.deleteUser); 
router.put('/update-user/:id', userController.updateUser); 

// router.put('/verify-user/:userId', authMiddleware, userController.verifyUser); 
router.put('/update-verification/:userId', userController.updateUserVerification)
router.get('/verify-user/:token', userController.verifyUser)

exports.router = router;
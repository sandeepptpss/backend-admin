const model = require('../model/user');
const { OAuth2Client } = require("google-auth-library");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const User = model.User;

exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ message: 'Username or Email is required' });
    }
    if(!password) {
      return res.status(400).send({ message: 'Password is required' });
    }
  // Search both username and email fields using the provided value
    const user = await User.findOne({
      $or: [
        { username: email },
        { email: email }
      ]
    });
    if(!user) {
      return res.status(404).send({ message: 'Username or Email not found' });
    }
    if (!user.verified) {
      return res.status(403).send({ message: 'Your account has not been verified by the administration yet' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
  )
  return res.status(200).send({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error during login', error);
    return res.status(500).send({ message: 'Server error', error: error.message });
  }
}
// Google Login

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username: name,
        email,
        password: "",
        verified: true,
        avatar: picture,
        role: "user",
      });
    }

    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({ message: "Google login successful", user, token: jwtToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid Google token", error: err.message });
  }
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    // Generate token and set expiration
    const token = crypto.randomBytes(32).toString('hex');
    const expiration = Date.now() + 3600000;
    // Save token and expiration to the user's record

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiration;
    await user.save();
    // Generate the reset password URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/?token=${token}`;
    // Set up the transporter for nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

  // Define email options, including the reset password link
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request',
      html: `<h2>Reset your password</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="
        display: inline-block;
        padding: 10px 20px;
        font-size: 16px;
        color: #ffffff;
        background-color: #000000ff;
        text-decoration: none;
        border-radius: 5px;
        border: none;
        text-align: center;">
        Reset your password
      </a>`,
  };
  await transporter.sendMail(mailOptions);
    return res.status(200).send({
      message: 'Password reset email sent',
      token,
      expiresAt: expiration,
  });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).send({ message: 'Server error', error: error.message });
  }
}
// function resetPassword 
exports.resetPassword = async (req, res) =>{
  try {
    const { token } = req.query;
    const { password } = req.body;
    if(!token) {
      return res.status(400).send({ message: 'Token is required' });
    }

    if (!password) {
      return res.status(400).send({ message: 'Password is required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if(!user) {
      return res.status(400).send({ message: 'Invalid or expired token' });
    }
    //Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    return res.status(200).send({ message: 'Password reset successful' });
    }catch (error) {
    return res.status(500).send({ message: 'Server error', error: error.message });
  }
}



exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
// Update user profile

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email, gender, role } = req.body;

    // Logged-in user (from JWT middleware)
    const loggedInUser = await User.findById(req.user.id);
    if (!loggedInUser) {
      return res.status(401).json({ success: false, message: "Unauthorized user" });
    }

    // User being updated
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (role && loggedInUser.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Only admin can update role." });
    }

    // Normal fields (allowed for everyone)
    if (name) userToUpdate.name = name;
    if (email) userToUpdate.email = email;
    if (gender) userToUpdate.gender = gender;

    // Only allow admin to update role
    if (role && loggedInUser.role === "admin") {
      userToUpdate.role = role;
    }

    // Handle profile upload (optional)
    if (req.files && req.files.length > 0) {
      const profileFile = req.files.find(f => f.fieldname === "profile");
      if (profileFile) {
        userToUpdate.profile = `uploads/images/${profileFile.filename}`;
      }
    }

    await userToUpdate.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: userToUpdate,
    });

  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// exports.updateUserProfile = async (req, res) => {
//   try {
//     const { name, email, role } = req.body;
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ message: "User not found" });
//     // Update allowed fields
//     if (name) user.name = name;
//     if (email) user.email = email;
//     if (role) user.role = role;
//     if (req.files && req.files.length > 0) {
//       // Find file with fieldname 'profile'
//       const profileFile = req.files.find(f => f.fieldname === 'profile');
//       if (profileFile) {
//         user.profile = `uploads/images/${profileFile.filename}`;
//       }
//   }
//   await user.save();
//     res.status(200).json({
//       success: true,
//       message: "Profile updated successfully",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         verified: user.verified,
//         profile: user.profile,
//       },
//     });
//   } catch (error) {
//     console.error("Error updating profile:", error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// }


exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // Make sure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

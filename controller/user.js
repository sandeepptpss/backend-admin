const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const model = require('../model/user');
const jwt = require('jsonwebtoken');
const User = model.User;

const sendAdminNotification = async (userEmail, verificationToken) => {
  try {
      const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });
      if(!process.env.ADMIN_EMAIL) {
          throw new Error('admin mail is not defined');
      }
    const verificationLink = `${process.env.BASE_URL}/api/verify-user/${verificationToken}`;
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL.trim(),
          subject: 'New User Registration Requires Approval',
          html:`A new user with email ${userEmail} has registered. Click the link to verify their account <a href=${verificationLink}>Verify</a>`,
    };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent ', info.response);
  } catch (error) {
    throw new Error('Failed to notify admin');
  }
}

exports.registerUser = async (req, res)=> {
  try {
      const { name, username, gender, email, password } = req.body;
      if (!name || !username || !gender || !email || !password) {
          return res.status(400).json({ code: 400, message: 'All fields are required' });
      }
      const profile = req.files[0]
      if (!req.files[0]){
          return res.status(400).send('No image file uploaded');
      }
      if (password.length < 8) {
          return res.status(400).json({ code: 400, message: 'Password must be at least 8 characters' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
          return res.status(400).json({ code: 400, message: 'Invalid email format' });
      }
      let existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        if(existingUser.verified) {
              return res.status(409).json({ code: 409, message: 'Email or Username already in use' });
          }
          existingUser.set({ name, username, gender, password: await bcrypt.hash(password, 10) });
          await existingUser.save();
          const verificationToken = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
          await sendAdminNotification(email, verificationToken);
          return res.status(200).json({ code: 200, message: 'Registration updated. Awaiting admin verification' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, username, gender, email,  profile: profile.path, password: hashedPassword, verified: false });
      await newUser.save();
      
      const verificationToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      await sendAdminNotification(email, verificationToken);
      res.status(201).json({ code: 201, message: 'Registration successful. Awaiting admin verification' });
      } catch (error) {

      res.status(500).json({ code: 500, message: 'Internal server error', error: error.message });
  }
};

// Admin verification endpoint
exports.verifyUser = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found' });
    }

    // Check if user is already verified
    if (user.verified) {
      return res.status(400).json({ code: 400, message: 'User already verified' });
    }

    user.verified = true;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email);

    res.status(200).json({ code: 200, message: 'User verified successfully' });
  } catch (error) {
    res.status(400).json({ code: 400, message: 'Invalid or expired verification token' });
  }
}

// Function to send verification email
const sendVerificationEmail = async (userEmail) => {
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const LoginLink = `${process.env.CLIENT_URL}/login`;
    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Account Verified Successfully',
      text: 'Congratulations! Your account has been verified successfully.',
      html: `<p>Congratulations! Your account has been verified successfully. You can now log in and enjoy our services.<a href=${LoginLink}>Login</a></p>`,
    
    };

  await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
  } catch (error) {
    console.error('Error sending email', error);
  }
}

exports.updateUserVerification = async (req, res) => {
  const { userId } = req.params;
  const { verified } = req.body;
  
  try {
    if(typeof verified !== 'boolean') {
      return res.status(400).json({ code: 400, message: 'Invalid verification status. It should be true or false.' });
   }

    const user = await User.findOneAndUpdate(
      { _id: userId, verified: { $ne: verified } },
      { verified },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found or already has the given verification status' });
    }
    if (verified) {
      sendVerificationEmail(user.email);
    }

   res.status(200).json({ code: 200, message: 'User verification status updated', user });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
}


exports.getAllUser = async (req, res) => {
    try {
      const viewUser = await User.find();
      res.status(200).json({
        code: 200,
        message: 'View all Users',
        data: viewUser,
      })
    }
    catch (error){
      res.status(500).json({
        code: 500,
        message: 'Internal server error',
        error: error.message,
      });
  }
}

exports.deleteUser = async (req, res) => {
    const id = req.params.id;
    try {
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        return res.status(404).json({ message: `No user found with ID ${id}` });
      }

      return res.status(200).json({
        code: 200,
        message: 'User deleted successfully',
        user: deletedUser,
      });
     } catch (error) {
     return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

exports.updateUser = async (req, res) =>{
    const { id } = req.params;
    try {
      const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
      if (!updatedUser) {
        return res.status(404).json({ message: `No user found with ID ${id}` });
      }
      return res.status(200).json({
        code: 200,
        message: 'Upadted user data successfully',
        user: updatedUser,
      });
    }
    catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
  }
}


// Update user

exports.updateUser = async (req, res) => {
  try {
    const { name, email, gender, role } = req.body;
    const updateData = { name, email, gender, role };

    // Handle profile image if uploaded
    if (req.files && req.files.length > 0) {
      const profileFile = req.files.find(file => file.fieldname === "profile");
      if (profileFile) {
        updateData.profile = `uploads/images/${profileFile.filename}`;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: `No user found with ID ${req.params.id}` });
    }

    res.status(200).json({ code: 200, message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// View profile
exports.viewProfile = async (req, res) => {
  try {
    if (req.user._id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};






































// const sendAdminNotification = async (userEmail) => {
//     try {
//       const transporter = nodemailer.createTransport({
//         host: 'smtp.gmail.com',
//         port: 465,
//         secure: true,
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//       });

//       if (!process.env.ADMIN_EMAIL) {
//         throw new Error('ADMIN_EMAIL is not defined');
//       }
//       const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: process.env.ADMIN_EMAIL.trim(),
//         subject: 'New User Registration Requires Approval',
//         text: `A new user with email ${userEmail} has registered. Please review and verify their account.`,
//       };

//       const info = await transporter.sendMail(mailOptions);
//       console.log('Email sent: ', info.response);
//     } catch (error) {
//       throw new Error('Failed to notify admin');
//     }
//   };
  
//   exports.registerUser = async (req, res) => {
//     try {
//       const { name, username, gender, email, password } = req.body;
//       if (!name || !username || !gender || !email || !password) {
//         return res.status(400).json({ code: 400, message: 'All fields are required' });
//       }
//       if (password.length < 8) {
//         return res.status(400).json({ code: 400, message: 'Password must be at least 8 characters' });
//       }
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(email)) {
//         return res.status(400).json({ code: 400, message: 'Invalid email format' });
//       }
//       let existingUser = await User.findOne({ $or: [{ email }, { username }] });
//       if (existingUser) {
//         if (existingUser.verified) {
//           return res.status(409).json({ code: 409, message: 'Email or Username already in use' });
//         }
//         existingUser.set({ name, username, gender, password: await bcrypt.hash(password, 10) });
//         await existingUser.save();
//         await sendAdminNotification(email);
//         return res.status(200).json({ code: 200, message: 'Registration updated. Awaiting admin verification.' });
//       }
//       const hashedPassword = await bcrypt.hash(password, 10);
//       const newUser = new User({ name, username, gender, email, password: hashedPassword, verified: false });
//       await newUser.save();
//       await sendAdminNotification(email);
//       res.status(201).json({ code: 201, message: 'Registration successful. Awaiting admin verification.' });
//     } catch (error) {
//       res.status(500).json({ code: 500, message: 'Internal server error', error: error.message });
//     }
//   };

//   exports.verifyUser = async (req, res) => {
//     try {
//       const { userId } = req.params;
  
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ code: 404, message: 'User not found' });
//       }
  
//       user.verified = true;
//       await user.save();
  
//       res.status(200).json({ code: 200, message: 'User verified successfully' });
//     } catch (error) {
//       res.status(500).json({ code: 500, message: 'Internal server error', error: error.message });
//     }
//   }

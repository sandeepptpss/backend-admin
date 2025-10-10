const mongoose =require('mongoose');
const {Schema} = mongoose;
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [4, 'Username must be at least 4 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format']
  },
  
  profile: { type: String, default: "" },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },

  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  resetPasswordToken:{ 
    type: String
  },
  resetPasswordExpires:{ 
   type: Date
 },
 token:{
   token: String
},

verified: {
    type: Boolean,
    default: false
  }
},
{ timestamps: true }
);
exports.User = mongoose.model('User', userSchema);
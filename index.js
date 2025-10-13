require('dotenv').config();
require('./db/config');

const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');

// Routers
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const blogRouter = require('./routes/blog');

const { generateRandomString } = require('./helpers/stringHelper');

// Logging a random ID for demonstration
console.log('Random ID:', generateRandomString(12));

const app = express();

// Middleware - enable CORS
app.use(cors());

// Middleware - parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/images'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// Only enable Multer where uploads are actually handled, not globally

// Serve static files from the uploads folder
app.use('/uploads', express.static('uploads'));

// Additional body parsing (legacy support)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// API Routes
app.use('/api', userRouter.router);
app.use('/api', authRouter.router);
app.use('/api', blogRouter.router);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
});

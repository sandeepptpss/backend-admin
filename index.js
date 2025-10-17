// server.js

// ------------------------------
// Load Environment Variables
// ------------------------------

require('dotenv').config();


// Import Dependencies
// ------------------------------
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');

// ------------------------------
// Database Connection
// ------------------------------
require('./db/config');


// ------------------------------
// Import Routes
// ------------------------------

const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const blogRouter = require('./routes/blog')

// ------------------------------
// Initialize Express App
// ------------------------------
const app = express();


// ------------------------------
// Middleware
// ------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// ------------------------------
// File Upload Configuration (Multer)
// ------------------------------

const storage = multer.diskStorage({
  destination: 'uploads/images',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${path.basename(file.originalname, ext)}-${Date.now()}${ext}`);
  },
})

const upload = multer({ storage });

// Make uploads folder accessible
app.use('/uploads', express.static('uploads'));


// Attach upload middleware globally (optional)
// You can also apply it only to specific routes for better control
app.use(upload.any());


// Routes
app.use('/api', userRouter.router);
app.use('/api', authRouter.router);
app.use('/api', blogRouter.router);


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`);
})


// require('dotenv').config();
// require('./db/config');
// const express = require('express');
// const multer = require('multer');
// const cors = require('cors');
// const path = require('path');
// const bodyParser = require('body-parser');
// const userRouter = require('./routes/user');
// const authRouter = require('./routes/auth');
// const blogRouter = require('./routes/blog')

// const app = express();
// app.use(cors());

// // Parse requests of content-type - application/json
// app.use(express.json());
// // Parse requests of content-type - application/x-www-form-urlencoded
// app.use(express.urlencoded({ extended: true }));

// // Serve static files (uploaded images)
// const storage = multer.diskStorage({
//   destination: 'uploads/images',
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, `${path.basename(file.originalname, ext)}-${Date.now()}${ext}`);
//   },
// })

// // Use Multer with storage configuration
// const upload = multer({ storage });
// app.use(upload.any())
// app.use('/uploads', express.static('uploads'));

// app.use(bodyParser.urlencoded({ extended: false }))
// app.use(bodyParser.json());

// // Routes
// app.use('/api', userRouter.router);
// app.use('/api', authRouter.router);
// app.use('/api', blogRouter.router);

// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server started: http://localhost:${PORT}`);
// });
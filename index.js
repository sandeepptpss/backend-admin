require('dotenv').config();
require('./db/config');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const blogRouter = require('./routes/blog')

const app = express();
app.use(cors());

// Parse requests of content-type - application/json
app.use(express.json());
// Parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
const storage = multer.diskStorage({
  destination: 'uploads/images',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${path.basename(file.originalname, ext)}-${Date.now()}${ext}`);
  },
})

// Use Multer with storage configuration
const upload = multer({ storage });
app.use(upload.any())
app.use('/uploads', express.static('uploads'));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

// Routes
app.use('/api', userRouter.router);
app.use('/api', authRouter.router);
app.use('/api', blogRouter.router);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`);
});
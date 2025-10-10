const express = require('express');
const router = express.Router();
const BlogController =require('../controller/blog')
router.post('/add-blog', BlogController.createBlog);
router.get('/view-blog', BlogController.viewBlog);
router.get('/get-blog/:id', BlogController.getBlog);
router.put('/update-blog/:id', BlogController.updateBlog); 
router.delete('/delete-blog/:id', BlogController.deleteBlog);
router.put('/update-blog/:id', BlogController.updateBlog);
exports.router = router;
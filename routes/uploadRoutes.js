const express = require('express');
const multer = require('multer');
const { uploadImage } = require('../controller/uploadController');

const router = express.Router();

// Use memory storage so we can stream buffer directly to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/upload  -> returns secure_url + public_id
router.post('/', upload.single('image'), uploadImage);

module.exports = router; 
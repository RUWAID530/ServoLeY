const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { strictBody } = require('../middleware/validation');
const { fileOwnershipManager } = require('../utils/fileOwnershipManager');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

// Upload image endpoint
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Store file ownership in database
    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      userId: req.user.id,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };

    const fileRecord = await fileOwnershipManager.storeFileOwnership(fileData);
    const imageUrl = fileRecord.url;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('File upload failed for user:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

// Authenticated file download endpoint
router.get('/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    // Check if user has permission to access this file
    const accessCheck = await fileOwnershipManager.checkFileAccess(filename, req.user.id, req.user.userType);
    
    if (!accessCheck.allowed) {
      return res.status(accessCheck.reason === 'File not found' ? 404 : 403).json({
        success: false,
        message: accessCheck.reason
      });
    }

    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('File send failed for user:', req.user?.id);
        res.status(500).json({
          success: false,
          message: 'Failed to serve file'
        });
      }
    });
  } catch (error) {
    console.error('Download failed for user:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
    });
  }
});

module.exports = router;

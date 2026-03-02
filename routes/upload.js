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

    let imageUrl = `/uploads/${req.file.filename}`;
    try {
      const fileRecord = await fileOwnershipManager.storeFileOwnership(fileData);
      if (fileRecord?.url) {
        imageUrl = fileRecord.url;
      }
    } catch (ownershipError) {
      // Keep upload successful even if metadata persistence fails.
      console.error('Failed to store file ownership:', ownershipError);
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('File upload failed for user:', req.user?.id, error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to upload image'
    });
  }
});

// Public image download endpoint for uploaded media used in service/provider cards.
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
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
        console.error('File send failed for filename:', filename);
        res.status(500).json({
          success: false,
          message: 'Failed to serve file'
        });
      }
    });
  } catch (error) {
    console.error('Download failed for filename:', req.params?.filename);
    res.status(500).json({
      success: false,
      message: 'Failed to download file'
    });
  }
});

router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Image must be 5MB or smaller'
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid file upload request'
    });
  }

  if (err?.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed'
    });
  }

  return next(err);
});

module.exports = router;

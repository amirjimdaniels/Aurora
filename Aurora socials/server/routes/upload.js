import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple, handleUploadError, getFileUrl } from '../middleware/upload.js';

const router = express.Router();

// Upload single file
router.post('/single', authenticateToken, uploadSingle, handleUploadError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  // Return the file URL (S3 URL in production, local path in dev)
  const fileUrl = getFileUrl(req.file);

  return res.json({
    success: true,
    message: 'File uploaded successfully',
    url: fileUrl,
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    }
  });
});

// Upload multiple files
router.post('/multiple', authenticateToken, uploadMultiple, handleUploadError, (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const files = req.files.map(file => ({
    url: getFileUrl(file),
    filename: file.filename || file.key,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  }));

  return res.json({
    success: true,
    message: `${files.length} file(s) uploaded successfully`,
    files
  });
});

export default router;

const { prisma } = require('../config/database');
const crypto = require('crypto');

class FileOwnershipManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generate a unique file ID
  generateFileId() {
    return crypto.randomUUID();
  }

  // Store file ownership in database
  async storeFileOwnership(fileData) {
    try {
      const fileId = this.generateFileId();
      
      // Store in database with proper relations
      const fileRecord = await prisma.file_ownership.create({
        data: {
          id: fileId,
          filename: fileData.filename,
          originalName: fileData.originalName,
          userId: fileData.userId,
          fileSize: fileData.fileSize,
          mimeType: fileData.mimeType,
          uploadedAt: new Date()
        }
      });

      return {
        fileId,
        filename: fileData.filename,
        url: `/api/upload/${fileData.filename}`
      };
    } catch (error) {
      console.error('Failed to store file ownership:', error);
      throw new Error('Failed to store file ownership');
    }
  }

  // Check if user has permission to access file
  async checkFileAccess(filename, userId, userType) {
    try {
      const fileRecord = await prisma.file_ownership.findFirst({
        where: {
          filename: filename
        }
      });

      if (!fileRecord) {
        return { allowed: false, reason: 'File not found' };
      }

      // Allow file owner or admin to access
      if (fileRecord.userId === userId || userType === 'ADMIN') {
        return { allowed: true, fileRecord };
      }

      return { allowed: false, reason: 'Access denied' };
    } catch (error) {
      console.error('Failed to check file access:', error);
      return { allowed: false, reason: 'Access check failed' };
    }
  }

  // Get user's files
  async getUserFiles(userId, page = 1, limit = 20) {
    try {
      const files = await prisma.file_ownership.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          uploadedAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      });

      return files.map(file => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        uploadedAt: file.uploadedAt,
        url: `/api/upload/${file.filename}`
      }));
    } catch (error) {
      console.error('Failed to get user files:', error);
      throw new Error('Failed to retrieve files');
    }
  }

  // Delete file ownership record
  async deleteFileOwnership(filename, userId, userType) {
    try {
      const fileRecord = await prisma.file_ownership.findFirst({
        where: {
          filename: filename
        }
      });

      if (!fileRecord) {
        return false;
      }

      // Only allow owner or admin to delete
      if (fileRecord.userId !== userId && userType !== 'ADMIN') {
        return false;
      }

      await prisma.file_ownership.delete({
        where: {
          id: fileRecord.id
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to delete file ownership:', error);
      return false;
    }
  }

  // Cleanup old files (for maintenance)
  async cleanupOldFiles(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.file_ownership.deleteMany({
        where: {
          uploadedAt: {
            lt: cutoffDate
          }
        }
      });

      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
      return 0;
    }
  }
}

module.exports = new FileOwnershipManager();


const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { restoreUserFromBackup } = require('./userBackup');

class TokenManager {
  // Generate access token
  static generateAccessToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
  }

  // Generate refresh token
  static generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  // Verify token and get user
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user in database
      let user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          profile: true,
          provider: true,
          wallet: true
        }
      });

      // If user not found in database, try to restore from backup
      if (!user) {
        console.log(`User not found in database for ID: ${decoded.userId}. Trying to restore from backup...`);

        try {
          const fs = require('fs');
          const path = require('path');
          const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'users');

          if (fs.existsSync(BACKUP_DIR)) {
            const files = fs.readdirSync(BACKUP_DIR);

            // Find the most recent backup for this user ID
            let latestBackup = null;
            let latestTime = 0;

            for (const file of files) {
              if (!file.endsWith('.json')) continue;
              if (!file.startsWith(decoded.userId)) continue;

              const filepath = path.join(BACKUP_DIR, file);
              const backupData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

              const fileTime = new Date(backupData.timestamp).getTime();
              if (fileTime > latestTime) {
                latestTime = fileTime;
                latestBackup = backupData;
              }
            }

            if (latestBackup) {
              // Try to restore the user
              const { userData } = latestBackup;

              // Check if user already exists in DB (in case of race condition)
              const existingUser = await prisma.user.findUnique({
                where: { id: decoded.userId }
              });

              if (!existingUser) {
                // Restore the user with the same ID
                user = await prisma.user.create({
                  data: userData,
                  include: {
                    profile: true,
                    provider: true,
                    wallet: true
                  }
                });

                console.log(`User restored from backup: ${user.id}`);
              } else {
                user = existingUser;
                console.log(`User found in database after backup check: ${user.id}`);
              }
            }
          }
        } catch (error) {
          console.error('Error trying to restore user from backup:', error);
        }
      }

      if (!user) {
        throw new Error('User not found');
      }

      // Check if the user is still active and not blocked
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      if (user.isBlocked) {
        throw new Error('Account is blocked');
      }

      return user;

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }

      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }

      throw error;
    }
  }

  // Refresh access token using refresh token
  static async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

      // Get user using the token manager
      const user = await this.verifyToken(refreshToken);

      // Generate new access token
      const accessToken = this.generateAccessToken(user.id);

      // Generate new refresh token
      const newRefreshToken = this.generateRefreshToken(user.id);

      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          isVerified: user.isVerified,
          profile: user.profile,
          provider: user.provider,
          wallet: user.wallet
        }
      };

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }

      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }

      throw error;
    }
  }
}

module.exports = TokenManager;

# 🚀 Servoley Platform Deployment Guide

This guide covers deploying the Servoley service marketplace platform to production.

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Cloud hosting account (Railway, Render, AWS, etc.)
- Domain name (optional)
- SSL certificate

## 🗄️ Database Setup

### Option 1: Railway PostgreSQL
1. Go to [Railway](https://railway.app)
2. Create new project
3. Add PostgreSQL database
4. Copy the connection string

### Option 2: Supabase
1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Go to Settings > Database
4. Copy the connection string

### Option 3: Neon
1. Go to [Neon](https://neon.tech)
2. Create new database
3. Copy the connection string

## 🚀 Backend Deployment

### Option 1: Railway (Recommended)

1. **Connect Repository**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project
   railway init
   ```

2. **Environment Variables**
   ```bash
   railway variables set DATABASE_URL="your-postgresql-url"
   railway variables set JWT_SECRET="your-jwt-secret"
   railway variables set TWILIO_ACCOUNT_SID="your-twilio-sid"
   railway variables set TWILIO_AUTH_TOKEN="your-twilio-token"
   # ... set all other variables
   ```

3. **Deploy**
   ```bash
   railway up
   ```

### Option 2: Render

1. **Create Web Service**
   - Connect your GitHub repository
   - Set build command: `npm install`
   - Set start command: `npm start`

2. **Environment Variables**
   - Add all variables from `.env.example`
   - Set `NODE_ENV=production`

3. **Database**
   - Create PostgreSQL database
   - Copy connection string to `DATABASE_URL`

### Option 3: AWS EC2

1. **Launch EC2 Instance**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd servoley-platform
   
   # Install dependencies
   npm install
   
   # Set environment variables
   cp env.example .env
   nano .env
   
   # Run migrations
   npm run migrate
   npm run seed
   
   # Start with PM2
   npm install -g pm2
   pm2 start server.js --name servoley-api
   pm2 startup
   pm2 save
   ```

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your repository
   - Set build command: `npm run build`
   - Set output directory: `dist`

2. **Environment Variables**
   ```env
   VITE_API_URL=https://your-backend-url.com
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
   ```

### Option 2: Netlify

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Connect your repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**
   - Add all frontend environment variables
   - Set `VITE_API_URL` to your backend URL

### Option 3: AWS S3 + CloudFront

1. **Build and Upload**
   ```bash
   npm run build
   aws s3 sync dist/ s3://your-bucket-name
   ```

2. **CloudFront Distribution**
   - Create CloudFront distribution
   - Set S3 bucket as origin
   - Configure custom domain

## 🔧 Production Configuration

### Environment Variables

```env
# Production Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT
JWT_SECRET="your-super-secure-jwt-secret"
JWT_EXPIRES_IN="7d"

# OTP
OTP_EXPIRES_IN="300"
OTP_LENGTH="6"

# Twilio
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="noreply@servoley.com"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# CORS
CORS_ORIGIN="https://your-frontend-domain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"
```

### Database Migrations

```bash
# Run migrations in production
npm run migrate

# Seed initial data
npm run seed
```

### SSL Certificate

For custom domains, ensure SSL certificates are configured:

- **Vercel/Netlify**: Automatic SSL
- **Railway**: Automatic SSL
- **AWS**: Use ACM (AWS Certificate Manager)
- **Custom Server**: Use Let's Encrypt

## 📊 Monitoring & Logging

### Application Monitoring

1. **Health Checks**
   ```bash
   curl https://your-api-domain.com/api/health
   ```

2. **Logging**
   ```javascript
   // Add to server.js
   const winston = require('winston');
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   ```

3. **Error Tracking**
   - Consider Sentry for error tracking
   - Set up alerts for critical errors

### Database Monitoring

1. **Connection Pooling**
   ```javascript
   // In database.js
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL
       }
     }
   });
   ```

2. **Query Optimization**
   - Monitor slow queries
   - Add database indexes
   - Use connection pooling

## 🔒 Security Checklist

### Backend Security

- [ ] Environment variables secured
- [ ] JWT secrets are strong and unique
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles this)
- [ ] HTTPS enforced
- [ ] Security headers (helmet.js)

### Database Security

- [ ] Database access restricted
- [ ] Connection strings secured
- [ ] Regular backups enabled
- [ ] Database user permissions minimal

### Frontend Security

- [ ] API keys not exposed in frontend
- [ ] HTTPS enforced
- [ ] Content Security Policy
- [ ] XSS protection

## 📈 Performance Optimization

### Backend Optimization

1. **Database Indexing**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_user_email ON users(email);
   CREATE INDEX idx_user_phone ON users(phone);
   CREATE INDEX idx_order_status ON orders(status);
   CREATE INDEX idx_transaction_wallet ON transactions(walletId);
   ```

2. **Caching**
   ```javascript
   // Add Redis for caching
   const redis = require('redis');
   const client = redis.createClient();
   ```

3. **Compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

### Frontend Optimization

1. **Code Splitting**
   ```javascript
   // Lazy load components
   const LazyComponent = React.lazy(() => import('./Component'));
   ```

2. **Image Optimization**
   - Use WebP format
   - Implement lazy loading
   - Optimize image sizes

3. **PWA Optimization**
   - Service worker caching
   - Offline functionality
   - App manifest

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   # Check database connection
   npx prisma db push
   ```

2. **Environment Variables**
   ```bash
   # Verify all required variables are set
   node -e "console.log(process.env.DATABASE_URL)"
   ```

3. **CORS Issues**
   ```javascript
   // Update CORS configuration
   app.use(cors({
     origin: process.env.CORS_ORIGIN?.split(',') || ['https://your-domain.com']
   }));
   ```

### Debugging

1. **Enable Debug Logs**
   ```bash
   DEBUG=* npm start
   ```

2. **Database Debugging**
   ```bash
   npx prisma studio
   ```

3. **API Testing**
   ```bash
   # Test health endpoint
   curl https://your-api-domain.com/api/health
   ```

## 📞 Support

For deployment issues:

1. Check the logs in your hosting platform
2. Verify environment variables
3. Test database connectivity
4. Check CORS configuration
5. Verify SSL certificates

---

**Servoley Platform** - Production deployment guide! 🚀



# Production Deployment Configuration for Servolay Admin Panel

## Environment Variables

### Backend (api.servolay.com)
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/servolay_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Server
PORT=8084
NODE_ENV=production

# CORS
CORS_ORIGIN=https://admin.servolay.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend (admin.servolay.com)
```bash
VITE_API_BASE_URL=https://api.servolay.com
VITE_APP_NAME=Servolay Admin
VITE_APP_VERSION=1.0.0
```

## Deployment Steps

### 1. Backend Deployment (api.servolay.com)

```bash
# Clone and setup
git clone <your-repo>
cd servolay-backend
npm install

# Setup database
psql -U postgres -c "CREATE DATABASE servolay_db;"
psql -U postgres -d servolay_db -f backend/database-schema.sql

# Build and run
npm run build
npm start
```

### 2. Frontend Deployment (admin.servolay.com)

```bash
# Clone and setup
git clone <your-repo>
cd servolay-admin
npm install

# Build for production
npm run build

# Deploy to web server
# Copy dist/ contents to /var/www/admin.servolay.com/
```

## Nginx Configuration

```nginx
# Admin Panel (admin.servolay.com)
server {
    listen 80;
    server_name admin.servolay.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.servolay.com;
    
    # SSL certificates
    ssl_certificate /path/to/admin.servolay.com.crt;
    ssl_certificate_key /path/to/admin.servolay.com.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Serve static files
    root /var/www/admin.servolay.com;
    index index.html;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API (api.servolay.com)
server {
    listen 80;
    server_name api.servolay.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.servolay.com;
    
    # SSL certificates
    ssl_certificate /path/to/api.servolay.com.crt;
    ssl_certificate_key /path/to/api.servolay.com.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:8084;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Checklist

### ✅ Backend Security
- [x] JWT authentication with role-based access control
- [x] Rate limiting on login endpoints
- [x] Account lockout after 5 failed attempts
- [x] Input validation and sanitization
- [x] SQL injection prevention with parameterized queries
- [x] CORS configuration
- [x] Helmet.js security headers
- [x] Audit logging for all admin actions

### ✅ Frontend Security
- [x] Secure token storage
- [x] Route protection
- [x] Input validation
- [x] XSS prevention
- [x] HTTPS enforcement

### ✅ Infrastructure Security
- [x] SSL/TLS certificates
- [x] Security headers
- [x] Rate limiting
- [x] Firewall rules
- [x] Regular backups

## Monitoring and Logging

### Application Monitoring
- Use PM2 for process management
- Set up log rotation
- Monitor error rates
- Track performance metrics

### Security Monitoring
- Monitor failed login attempts
- Track admin actions via audit logs
- Set up alerts for suspicious activity
- Regular security audits

## Backup Strategy

### Database Backups
```bash
# Daily backup
0 2 * * * pg_dump -U postgres servolay_db > /backups/servolay_$(date +\%Y\%m\%d).sql

# Weekly backup retention
0 3 * * 0 find /backups -name "servolay_*.sql" -mtime +7 -delete
```

### File Backups
- Backup uploaded documents
- Backup configuration files
- Store backups off-site

## Performance Optimization

### Backend
- Database indexing
- Query optimization
- Caching strategies
- Load balancing

### Frontend
- Code splitting
- Lazy loading
- Asset optimization
- CDN usage

## Scaling Considerations

### Horizontal Scaling
- Load balancer setup
- Multiple app instances
- Database replication
- Microservices architecture

### Vertical Scaling
- Resource monitoring
- Performance tuning
- Capacity planning

## Maintenance

### Regular Tasks
- Security updates
- Dependency updates
- Log review
- Performance monitoring
- Backup verification

### Emergency Procedures
- Incident response plan
- Rollback procedures
- Communication protocols
- Recovery steps

# 🚀 Servoley - Service Marketplace Platform

A comprehensive service marketplace platform connecting customers with local service providers in Tirunelveli, Tamil Nadu.

## 📱 Platform Overview

**Servoley** is a full-stack service marketplace platform with three main applications:

- **Customer App** (PWA) - Book, pay, and review services
- **Provider App** (PWA) - Manage orders, earnings, and services  
- **Admin Dashboard** (Web) - Monitor platform, users, and finances

## 🛠️ Tech Stack

- **Frontend**: React + Tailwind CSS + Vite (PWA-enabled)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: OTP-based (SMS/Email)
- **Payments**: Razorpay (Phase 2)
- **Communication**: Twilio/Exotel (Phase 4)
- **Location**: Google Maps API

## 🚀 Quick Start

### Using Batch Files (Windows)

For Windows users, the following batch files are available to simplify starting and managing the application:

#### Main Batch Files

1. **start_all.bat** - Starts all components of the application (server, customer PWA, provider PWA)
2. **dev-start.bat** - Comprehensive development startup script with environment configuration
3. **start-backend-only.bat** - Specialized script for starting only the backend with proper checks
4. **diagnose-backend.bat** - Diagnostic tool for troubleshooting backend issues
5. **restart_server.bat** - Utility to restart the server by killing existing processes

#### Usage

- For normal development, use `dev-start.bat` to start both backend and frontend with proper configuration.
- For full application testing, use `start_all.bat` to start all components including the provider PWA.
- If you only need to work on the backend, use `start-backend-only.bat`.
- If you encounter issues with the backend, use `diagnose-backend.bat` to troubleshoot.
- To restart the server, use `restart_server.bat`.

### Manual Setup

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   # Access this repository through your corporate version control system
   cd servoley-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/servoley_db"
   JWT_SECRET="your-super-secret-jwt-key-here"
   TWILIO_ACCOUNT_SID="your-twilio-account-sid"
   TWILIO_AUTH_TOKEN="your-twilio-auth-token"
   # ... other environment variables
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run generate
   
   # Run database migrations
   npm run migrate
   
   # Seed the database with sample data
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 📊 Database Schema

### Core Models

- **User**: Customer, Provider, Admin users
- **Profile**: User profile information
- **Provider**: Service provider details
- **Service**: Services offered by providers
- **Wallet**: User wallet system
- **Transaction**: Financial transactions
- **Order**: Service bookings
- **Review**: Service reviews and ratings
- **OTP**: One-time passwords for authentication
- **Message**: In-app chat messages
- **Ticket**: Support tickets

### Key Relationships

- User → Profile (1:1)
- User → Wallet (1:1)
- User → Provider (1:1, for providers only)
- Provider → Service (1:many)
- User → Order (1:many, as customer/provider)
- Wallet → Transaction (1:many)

## 🔐 Authentication System

### OTP-Based Authentication

- **SMS OTP**: Via Twilio integration
- **Email OTP**: Via Nodemailer
- **JWT Tokens**: For session management
- **Role-Based Access**: Customer, Provider, Admin

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/wallet` - Get wallet
- `GET /api/users/orders` - Get user orders
- `GET /api/users/reviews` - Get user reviews

#### Profiles
- `GET /api/profiles/` - Get profile
- `PUT /api/profiles/` - Update profile
- `POST /api/profiles/avatar` - Upload avatar
- `GET /api/profiles/provider` - Get provider profile
- `POST /api/profiles/provider` - Create/Update provider profile

#### OTP
- `POST /api/otp/send` - Send OTP
- `POST /api/otp/verify` - Verify OTP
- `GET /api/otp/status/:userId` - Get OTP status

## 🏗️ Project Structure

```
servoley-platform/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── profiles.js          # Profile management routes
│   └── otp.js               # OTP management routes
├── utils/
│   ├── otp.js               # OTP utilities
│   ├── sms.js                # SMS utilities
│   └── email.js              # Email utilities
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.js              # Database seeding
├── server.js                # Main server file
├── package.json             # Dependencies
└── README.md                # This file
```

## 🔧 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/servoley_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# OTP
OTP_EXPIRES_IN="300"
OTP_LENGTH="6"

# Twilio (SMS)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="noreply@servoley.com"

# Server
PORT="3000"
NODE_ENV="development"
```

## 📱 API Usage Examples

### User Registration

```javascript
// Register a new customer
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userType: 'CUSTOMER',
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Doe'
  })
});
```

### OTP Verification

```javascript
// Verify OTP
const response = await fetch('/api/auth/verify-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'user-id',
    code: '123456'
  })
});
```

### Get User Profile

```javascript
// Get user profile (requires authentication)
const response = await fetch('/api/users/profile', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
```

## 🚀 Project IDX Deployment

This project is configured to work with Google Project IDX for cloud-based development and deployment.

### Quick Start on Project IDX

1. Import the project to your Project IDX workspace
2. Set up the environment variables in the Project IDX environment settings:
   - `PROJECT_IDX_URL`: Your Project IDX URL (e.g., `https://your-project-id.idx.dev`)
   - `DATABASE_URL`: Your PostgreSQL connection string
   - Other required variables from `.env.example`
3. Run the following command to start the application:
   ```bash
   npm run idx
   ```

### Project IDX Specific Configuration

The project includes specific configurations for Project IDX:

- Environment variables for API URLs and CORS origins
- Vite proxy configuration for API calls
- Scripts for running the application in Project IDX

For more detailed instructions, see `PROJECT_IDX_README.md`.

## 🚀 Development Phases

### Phase 1: Authentication + Database ✅
- [x] Database schema with Prisma
- [x] OTP authentication system
- [x] Role-based access control
- [x] User profile management

### Phase 2: Wallet & Payments (Next)
- [ ] Wallet system implementation
- [ ] Razorpay payment gateway
- [ ] Commission logic (2% platform fee)
- [ ] Transaction tracking

### Phase 3: Order Management
- [ ] Service catalog
- [ ] Order booking system
- [ ] Provider acceptance workflow
- [ ] Order status tracking

### Phase 4: Communication
- [ ] Masked calling (Twilio)
- [ ] In-app chat system
- [ ] Push notifications
- [ ] Email/SMS alerts

### Phase 5: Admin Dashboard
- [ ] Admin web dashboard
- [ ] User management
- [ ] Order monitoring
- [ ] Financial reports

### Phase 6: UI/UX & Deployment
- [ ] Mobile-first PWAs
- [ ] Responsive admin dashboard
- [ ] Cloud deployment
- [ ] Production optimization

## 🤝 Contributing

1. Create a feature branch in your corporate version control system
2. Make your changes
3. Add tests if applicable
4. Submit a merge request through your corporate code review process

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Submit a ticket through your corporate support system
- Contact the development team through internal channels
- Check the documentation

---

**Servoley** - Connecting Tirunelveli with quality services! 🚀
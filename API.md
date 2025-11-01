# 📚 ServoLeY API Documentation

Complete API documentation for the ServoLeY service marketplace platform.

## 🔗 Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📱 API Endpoints

### 🔐 Authentication Endpoints

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "userType": "CUSTOMER|PROVIDER|ADMIN",
  "email": "user@example.com",
  "phone": "+919876543210",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your account with the OTP sent.",
  "data": {
    "userId": "user-id",
    "userType": "CUSTOMER",
    "isVerified": false
  }
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "userId": "user-id",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account verified successfully",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "userType": "CUSTOMER",
      "isVerified": true,
      "profile": { ... },
      "wallet": { ... }
    }
  }
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent for login verification",
  "data": {
    "userId": "user-id",
    "userType": "CUSTOMER",
    "isVerified": true
  }
}
```

#### Get Current User
```http
GET /api/auth/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "userType": "CUSTOMER",
      "profile": { ... },
      "wallet": { ... }
    }
  }
}
```

### 💰 Wallet Endpoints

#### Get Wallet Balance
```http
GET /api/wallet/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1000.00,
    "currency": "INR"
  }
}
```

#### Get Wallet Transactions
```http
GET /api/wallet/transactions?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "transaction-id",
        "amount": 500.00,
        "type": "CREDIT",
        "description": "Wallet top-up via UPI",
        "paymentMethod": "UPI",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### Create Wallet Top-up Order
```http
POST /api/wallet/topup/create-order
```

**Request Body:**
```json
{
  "amount": 1000.00,
  "paymentMethod": "UPI"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment order created successfully",
  "data": {
    "orderId": "order_123456789",
    "amount": 1000.00,
    "currency": "INR",
    "key": "rzp_test_123456789"
  }
}
```

#### Verify Top-up Payment
```http
POST /api/wallet/topup/verify
```

**Request Body:**
```json
{
  "orderId": "order_123456789",
  "paymentId": "pay_123456789",
  "signature": "signature_string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and money added to wallet",
  "data": {
    "amount": 1000.00,
    "newBalance": 1500.00,
    "paymentId": "pay_123456789"
  }
}
```

#### Check Balance Before Booking
```http
POST /api/wallet/check-balance
```

**Request Body:**
```json
{
  "amount": 500.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasSufficientBalance": true,
    "currentBalance": 1000.00,
    "required": 500.00,
    "shortfall": 0.00
  }
}
```

### 💳 Payment Endpoints

#### Create Service Booking Payment
```http
POST /api/payments/create-order
```

**Request Body:**
```json
{
  "serviceId": "service-id",
  "amount": 500.00,
  "paymentMethod": "WALLET"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created and payment processed",
  "data": {
    "orderId": "order-id",
    "amount": 500.00,
    "commission": 10.00,
    "providerAmount": 490.00,
    "paymentMethod": "WALLET"
  }
}
```

#### Verify Payment
```http
POST /api/payments/verify
```

**Request Body:**
```json
{
  "orderId": "order_123456789",
  "paymentId": "pay_123456789",
  "signature": "signature_string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and order created",
  "data": {
    "orderId": "order-id",
    "amount": 500.00,
    "commission": 10.00,
    "providerAmount": 490.00,
    "paymentId": "pay_123456789"
  }
}
```

#### Process Refund
```http
POST /api/payments/refund
```

**Request Body:**
```json
{
  "orderId": "order-id",
  "amount": 500.00,
  "reason": "Order cancellation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "orderId": "order-id",
    "refundAmount": 500.00,
    "newBalance": 1500.00
  }
}
```

### 👤 User Profile Endpoints

#### Get User Profile
```http
GET /api/users/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "userType": "CUSTOMER",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "address": "123 Main St",
        "pincode": "627001",
        "city": "Tirunelveli"
      },
      "wallet": {
        "balance": 1000.00
      }
    }
  }
}
```

#### Update User Profile
```http
PUT /api/users/profile
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "address": "123 Main St",
  "pincode": "627001",
  "city": "Tirunelveli"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "address": "123 Main St",
      "pincode": "627001",
      "city": "Tirunelveli"
    }
  }
}
```

### 🏢 Provider Endpoints

#### Create Provider Profile
```http
POST /api/profiles/provider
```

**Request Body:**
```json
{
  "businessName": "John's Services",
  "providerType": "FREELANCER",
  "category": "Home Cleaning",
  "area": "Palayamkottai",
  "address": "123 Main St, Tirunelveli",
  "panNumber": "ABCDE1234F",
  "aadhaarNumber": "123456789012",
  "gstNumber": "33ABCDE1234F1Z5",
  "bankAccount": "1234567890123456",
  "upiId": "john@paytm"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider profile updated successfully",
  "data": {
    "provider": {
      "id": "provider-id",
      "businessName": "John's Services",
      "providerType": "FREELANCER",
      "category": "Home Cleaning",
      "isVerified": false
    }
  }
}
```

### 📊 Analytics Endpoints

#### Get Transaction Summary
```http
GET /api/wallet/summary?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransactions": 25,
    "totalCredits": 5000.00,
    "totalDebits": 3000.00,
    "totalRefunds": 500.00,
    "totalCommission": 100.00,
    "creditCount": 10,
    "debitCount": 15
  }
}
```

#### Get Provider Earnings
```http
GET /api/wallet/earnings?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "providerId": "provider-id",
    "providerName": "John's Services",
    "totalEarnings": 5000.00,
    "currentBalance": 2500.00,
    "transactionCount": 20,
    "averageEarningPerTransaction": 250.00
  }
}
```

#### Get Platform Revenue (Admin)
```http
GET /api/wallet/admin/revenue?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCommission": 1000.00,
    "totalOrders": 100,
    "averageCommissionPerOrder": 10.00,
    "transactionCount": 100
  }
}
```

## 🔧 Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Access token required"
}
```

### Insufficient Balance Error
```json
{
  "success": false,
  "message": "Insufficient wallet balance",
  "shortfall": 200.00
}
```

### Payment Error
```json
{
  "success": false,
  "message": "Invalid payment signature"
}
```

## 📝 Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## 🔒 Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 🌐 CORS Configuration

- **Allowed Origins**: Configured via `CORS_ORIGIN` environment variable
- **Credentials**: Supported
- **Methods**: GET, POST, PUT, DELETE, OPTIONS

## 📱 Webhook Events

### Razorpay Webhooks

**Endpoint**: `POST /api/payments/webhook`

**Events Handled**:
- `payment.captured` - Payment successfully captured
- `payment.failed` - Payment failed
- `refund.created` - Refund created

**Headers Required**:
```
X-Razorpay-Signature: <signature>
Content-Type: application/json
```

## 🧪 Testing

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Servoley API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## 📚 Examples

### Complete Wallet Top-up Flow

1. **Create Payment Order**
```bash
curl -X POST http://localhost:3000/api/wallet/topup/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "paymentMethod": "UPI"}'
```

2. **Verify Payment** (after Razorpay payment)
```bash
curl -X POST http://localhost:3000/api/wallet/topup/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "order_123", "paymentId": "pay_123", "signature": "sig_123"}'
```

### Service Booking Flow

1. **Check Balance**
```bash
curl -X POST http://localhost:3000/api/wallet/check-balance \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}'
```

2. **Create Order with Wallet Payment**
```bash
curl -X POST http://localhost:3000/api/payments/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"serviceId": "service_123", "amount": 500, "paymentMethod": "WALLET"}'
```

---

**Servoley API** - Complete documentation for Phase 2! 🚀



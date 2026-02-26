# 🗄️ PostgreSQL Database Setup Guide

## 🎯 **QUICK SETUP FOR SERVICE PROVIDER PLATFORM**

### **Step 1: Install PostgreSQL**
```bash
# Windows: Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey: choco install postgresql
# During installation, set password: postgres
```

### **Step 2: Create Database**
```sql
-- Open pgAdmin or psql command line
-- Create database
CREATE DATABASE merchant_platform;

-- Connect to database
\c merchant_platform;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **Step 3: Run Schema**
```bash
# Run the schema file
psql -U postgres -d merchant_platform -f professional-database.sql
```

### **Step 4: Update .env Password**
```env
# Update your password in .env file
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/merchant_platform
```

### **Step 5: Start Backend**
```bash
node backend-database.cjs
```

---

## 🔍 **ALTERNATIVE: Use In-Memory for Testing**

If PostgreSQL setup is taking time, you can temporarily use the memory version:

```bash
node backend-json.cjs
```

---

## ✅ **Verification**

Once PostgreSQL is running:
1. Backend will show: "✅ PostgreSQL connected successfully"
2. Demo user will be created in database
3. Data will persist after server restart

---

## 🚨 **Common Issues**

**Issue:** "auth_failed" error
**Solution:** 
1. Check PostgreSQL is running
2. Verify password in .env matches PostgreSQL password
3. Ensure database "merchant_platform" exists

**Issue:** Database doesn't exist
**Solution:** Run Step 2 to create database

---

## 🎉 **Ready to Test**

After setup:
1. Visit: http://localhost:5174
2. Login: demo@provider.com / demo123
3. Data will be stored in PostgreSQL database!

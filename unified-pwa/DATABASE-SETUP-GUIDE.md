# 🗄️ DATABASE SETUP GUIDE

## 🎯 **Goal: Persistent user data that survives server restarts**

## 📋 **STEP 1: Install PostgreSQL**

### **Windows:**
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run installer with default settings
3. Set password (remember it!)
4. Install pgAdmin (included)

### **macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### **Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 📋 **STEP 2: Create Database**

### **Option 1: Using pgAdmin (GUI)**
1. Open pgAdmin
2. Right-click on "Databases" → "Create" → "Database"
3. Name: `servo_ley_platform`
4. Click "Save"

### **Option 2: Using Command Line**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE servo_ley_platform;

-- Connect to the new database
\c servo_ley_platform
```

## 📋 **STEP 3: Run Database Schema**

### **Option 1: Using pgAdmin**
1. Open pgAdmin
2. Select `servo_ley_platform` database
3. Click "Tools" → "Query Tool"
4. Copy contents of `database-setup.sql`
5. Paste and run (F5)

### **Option 2: Using Command Line**
```bash
psql -U postgres -d servo_ley_platform -f database-setup.sql
```

## 📋 **STEP 4: Update Backend Configuration**

Edit `backend-database.cjs` file:

```javascript
// Find this section (around line 15-20):
const pool = new Pool({
  user: 'postgres',           // Update if different
  host: 'localhost',
  database: 'servo_ley_platform',
  password: 'your_password',  // ⚠️ UPDATE THIS!
  port: 5432,
});
```

**Replace `'your_password'` with your actual PostgreSQL password**

## 📋 **STEP 5: Start Database Backend**

```bash
# Stop current backend (if running)
taskkill /F /IM node.exe

# Start new database backend
node backend-database.cjs
```

## 📋 **STEP 6: Test Database Connection**

```bash
# Test endpoint
curl http://localhost:8084/api/test

# Should return:
# {"success":true,"message":"Backend API is working!","usersCount":1,"providersCount":1}
```

## 📋 **STEP 7: Register and Test**

1. **Register a provider:**
   - Go to: http://localhost:5174/providersignup
   - Fill all 9 steps
   - Submit registration

2. **Test login:**
   - Login with same credentials
   - Should work perfectly

3. **Test persistence:**
   - Stop backend: `taskkill /F /IM node.exe`
   - Restart backend: `node backend-database.cjs`
   - Login again - should still work!

## 🔧 **TROUBLESHOOTING**

### **❌ "Connection refused"**
```bash
# Check if PostgreSQL is running
pg_ctl status

# Start PostgreSQL service
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

### **❌ "Password authentication failed"**
```bash
# Reset PostgreSQL password
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';
```

### **❌ "Database does not exist"**
```bash
# Create database manually
createdb servo_ley_platform
```

### **❌ "Relation does not exist"**
```bash
# Run schema file again
psql -U postgres -d servo_ley_platform -f database-setup.sql
```

## 🎯 **SUCCESS INDICATORS**

### **✅ **Database Working:**
```
🌐 Backend starts without errors
📊 Test endpoint returns user counts
📝 Registration stores in database
🔐 Login works with database users
🔄 Data survives server restarts
```

### **✅ **Check Database:**
```sql
-- View all users
SELECT * FROM users;

-- View all providers
SELECT * FROM providers;

-- Check counts
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM providers;
```

## 🚀 **PRODUCTION DEPLOYMENT**

### **✅ **Environment Variables:**
```env
DATABASE_URL=postgresql://username:password@host:5432/servo_ley_platform
JWT_SECRET=your-production-secret-key
NODE_ENV=production
```

### **✅ **Security:**
```sql
-- Create dedicated database user
CREATE USER servo_ley_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE servo_ley_platform TO servo_ley_user;
```

## 🎉 **BENEFITS**

### **✅ **Persistent Storage:**
```
💾 Data survives server restarts
🔄 Backups can be created
📊 Historical data preserved
👥 Multiple users supported
🔐 Secure authentication
```

### **✅ **Professional Features:**
```
📈 Real analytics possible
📊 User statistics
🔍 Advanced queries
💼 Business intelligence
🔄 Data migration tools
```

**🎉 Your platform now has persistent database storage!**

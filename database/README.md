# Service Marketplace Database Setup

This directory contains the database schema and seed data for the Service Marketplace application.

## Prerequisites

- PostgreSQL installed and running
- Node.js and npm installed
- Prisma CLI installed (`npm install -g prisma`)

## Setup Instructions

1. **Configure Database Connection**

   Update the `DATABASE_URL` environment variable in your `.env` file to point to your PostgreSQL database:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/service_marketplace"
   ```

2. **Install Dependencies**

   From the project root directory, run:

   ```
   npm install
   ```

3. **Generate Prisma Client**

   Run the following command to generate the Prisma client based on your schema:

   ```
   npx prisma generate
   ```

4. **Create Database Schema**

   Apply the database schema to your PostgreSQL database:

   ```
   npx prisma db push
   ```

   Alternatively, you can manually execute the schema.sql file:

   ```
   psql -d service_marketplace -f database/schema.sql
   ```

5. **Seed the Database**

   Populate the database with sample data:

   ```
   node database/seed.js
   ```

## Database Schema

The database consists of the following main tables:

- `users` - Stores user accounts (customers, providers, and admins)
- `user_profiles` - Stores user profile information
- `providers` - Stores provider-specific information
- `wallets` - Stores user wallet balances
- `services` - Stores services offered by providers
- `orders` - Stores customer orders
- `reviews` - Stores customer reviews for providers
- `transactions` - Stores financial transactions
- `otp_codes` - Stores OTP codes for authentication
- `user_backups` - Stores user data backups for recovery

## Sample Data

The seed script creates:

1. A sample customer user:
   - Email: customer@example.com
   - Phone: 9876543210
   - Password: password123

2. A sample provider user:
   - Email: provider@example.com
   - Phone: 9876543211
   - Password: password123
   - Business Name: Smith Home Services

3. Sample services, orders, reviews, and transactions

## Troubleshooting

If you encounter issues during setup:

1. Ensure PostgreSQL is running and accessible
2. Check that the database connection details in your `.env` file are correct
3. Verify that the database user has the necessary permissions

## Resetting the Database

To reset the database (delete all data and reapply the schema):

```
npx prisma db push --force-reset
node database/seed.js
```

## Visualizing the Database

You can use Prisma Studio to visualize and interact with your database:

```
npx prisma studio
```

This will open a web interface where you can view and edit your database data.

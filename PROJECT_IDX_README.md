# ServoLeY Project IDX Deployment Guide

This guide explains how to deploy the ServoLeY service marketplace application on Google Project IDX.

## Project Structure

- **Backend**: Node.js/Express server with PostgreSQL database
- **Admin Web**: React admin interface
- **Customer PWA**: Progressive Web App for customers
- **Provider PWA**: Progressive Web App for service providers

## Environment Configuration

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the following environment variables in your `.env` file:
   - `PROJECT_IDX_URL`: Add your Project IDX URL (e.g., `https://your-project-id.idx.dev`)
   - `CORS_ORIGIN`: Include your Project IDX URL in the list
   - `DATABASE_URL`: Configure your PostgreSQL connection
   - Other service-specific configurations (JWT, email, SMS, payments)

## Frontend Configuration

The frontend applications are configured to use environment variables for API connections:

- `VITE_API_URL`: Backend API URL
- `PORT`: Frontend port (defaults to 8081 for customer PWA)

## Running the Application

### Backend Server

Start the backend server:
```bash
npm start
```

### Frontend Applications

Start the customer PWA:
```bash
cd customer-pwa
npm run dev
```

Start the provider PWA:
```bash
cd provider-pwa
npm run dev
```

Start the admin web:
```bash
cd admin-web
npm run dev
```

## Database Setup

Run Prisma migrations:
```bash
npx prisma migrate dev
```

Generate Prisma client:
```bash
npx prisma generate
```

## Project IDX Specific Notes

1. **CORS Configuration**: Make sure your Project IDX URL is included in the CORS origins list in both the server.js file and environment variables.

2. **Port Configuration**: Project IDX may assign different ports than your local development environment. The applications are configured to use environment variables for port configuration.

3. **Environment Variables**: Project IDX supports environment variables through its UI. Make sure to set all required variables in the Project IDX environment settings.

4. **Database**: Configure your database connection to work with Project IDX's networking setup.

## Troubleshooting

1. **CORS Errors**: Verify your Project IDX URL is included in the CORS origins list.

2. **API Connection Issues**: Check that `VITE_API_URL` is correctly set to your backend server URL.

3. **Database Connection**: Ensure the database URL is correctly configured for Project IDX's environment.

4. **Port Conflicts**: If ports are already in use, update the PORT environment variable for the affected service.

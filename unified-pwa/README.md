# ServoLeY - Service Marketplace Platform

A unified platform connecting service providers with customers in Tirunelveli.

## Features

- User Registration (Customers & Service Providers)
- Service Listing and Management
- Order Management
- Real-time Chat between Customers and Providers
- Notifications System
- Order Status Tracking

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone [repository-url]
   cd unified-pwa
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. For Project IDX deployment:
   ```
   npm run idx
   ```

## Project Structure

- `src/pages/` - Contains all page components
- `src/components/` - Reusable components
- `src/App.tsx` - Main application component with routing
- `src/main.tsx` - Application entry point
- `src/styles.css` - Global styles and Tailwind imports

## API Integration

The application connects to a backend API at `http://localhost:8083` (configurable via environment variable `VITE_API_URL`).

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:8083)
- `PORT` - Frontend port (default: 5175)

## Deployment

The application is configured to work with Project IDX and can be deployed with minimal configuration.

## License

© 2024 ServoLeY. All rights reserved.

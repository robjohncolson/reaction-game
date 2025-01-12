export const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'YOUR_RAILWAY_DEPLOYMENT_URL'  // Replace with the URL Railway gives you after deployment
  : 'http://localhost:3001' 
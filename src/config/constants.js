export const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://reliable-mercy-production.up.railway.app:8080'  // Include the port number
  : 'http://localhost:3001' 
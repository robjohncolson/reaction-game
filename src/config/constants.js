export const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://reliable-mercy-production.up.railway.app'  // Railway handles the port internally
  : 'http://localhost:3001' 
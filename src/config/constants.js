export const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://reaction-game-server-production.up.railway.app'  // Your Railway URL
  : 'http://localhost:3001' 
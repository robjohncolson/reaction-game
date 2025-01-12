export const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-socket-server-url.com'  // You'll replace this with your deployed server URL
  : 'http://localhost:3001' 
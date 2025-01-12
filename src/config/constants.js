export const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://reliable-mercy-production.up.railway.app'  // Railway handles the port internally
  : 'http://localhost:3001' 

// Add Supabase constants
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY 
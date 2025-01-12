import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iyehepkcebvmmtphrvgt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZWhlcGtjZWJ2bW10cGhydmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MDkzNTQsImV4cCI6MjA1MjI4NTM1NH0.CNyc9S8DZZ-fu0r1ZV9FiTsoFCly5cLIR5M9PS0ggyw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 
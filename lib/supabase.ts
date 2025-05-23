import { createClient } from "@supabase/supabase-js"

// Hardcoded values (not recommended for production)
const supabaseUrl = "https://lqqqgddfnfddvftbhjta.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcXFnZGRmbmZkZHZmdGJoanRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDc5NTI5MiwiZXhwIjoyMDYwMzcxMjkyfQ.u3LyI7-_o79mDUt5PRbE8JEEonID224Z99kIrmKUmk0"

// Create a single supabase client for the browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create a server-side client with service role for admin operations
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

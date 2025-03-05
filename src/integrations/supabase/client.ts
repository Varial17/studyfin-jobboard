
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nluwegaxtjekbpccjuxt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sdXdlZ2F4dGpla2JwY2NqdXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NDQxMzEsImV4cCI6MjA1NjEyMDEzMX0.ZEE901-T8RfG8JVY5Q5umChmaZpmDM9BRpE3db8s5YQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Add some debug info to help troubleshoot
console.log("Supabase client initialized with URL:", SUPABASE_URL);

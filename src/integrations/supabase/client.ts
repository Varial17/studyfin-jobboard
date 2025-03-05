
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nluwegaxtjekbpccjuxt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sdXdlZ2F4dGpla2JwY2NqdXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NDQxMzEsImV4cCI6MjA1NjEyMDEzMX0.ZEE901-T8RfG8JVY5Q5umChmaZpmDM9BRpE3db8s5YQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'studyfin-auth-key',
      detectSessionInUrl: true, // Handle OAuth redirects properly
    },
    global: {
      fetch: function customFetch(url: RequestInfo | URL, options?: RequestInit) {
        try {
          // Enhanced logging for debugging connection issues
          console.log("Supabase request to:", typeof url === 'string' ? url : url.toString());
          return fetch(url, options);
        } catch (error) {
          console.error("Supabase fetch error:", error);
          throw error;
        }
      }
    },
  }
);

// Add debug info to console
console.log("Supabase client initialized with URL:", SUPABASE_URL);

// Create a helper function to check Supabase connection
export const checkSupabaseConnection = async () => {
  try {
    console.log("Testing Supabase connection...");
    
    // First check if auth is working
    const authResponse = await supabase.auth.getSession();
    if (authResponse.error) {
      console.error("Supabase auth connection test failed:", authResponse.error);
      return false;
    }
    
    // Then try a simple database query
    const { data, error } = await supabase.from('profiles').select('count()', { count: 'exact' }).limit(1);
    
    if (error) {
      console.error("Supabase database connection test failed:", error);
      return false;
    }
    
    console.log("Supabase connection test successful:", data);
    return true;
  } catch (error) {
    console.error("Critical Supabase connection error:", error);
    return false;
  }
};

// Run a connection test immediately
checkSupabaseConnection().then(connected => {
  if (connected) {
    console.log("✅ Supabase is connected and working");
  } else {
    console.error("❌ Could not connect to Supabase - check credentials and network");
  }
});

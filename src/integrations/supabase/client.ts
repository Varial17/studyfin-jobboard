
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
      fetch: (...args) => {
        // Log request before sending (useful for debugging)
        console.log("Supabase fetch request:", args[0]);
        return fetch(...args);
      }
    },
  }
);

// Add some debug info to help troubleshoot
console.log("Supabase client initialized with URL:", SUPABASE_URL);

// Create a helper function to check Supabase connection
export const checkSupabaseConnection = async () => {
  try {
    console.log("Testing Supabase connection...");
    const { data, error } = await supabase.from('profiles').select('count()', { count: 'exact' }).limit(1);
    if (error) {
      console.error("Supabase connection test failed:", error);
      return false;
    }
    console.log("Supabase connection test successful, count:", data);
    return true;
  } catch (error) {
    console.error("Unexpected error testing Supabase connection:", error);
    return false;
  }
};

// Test connection on init - run immediately to check connectivity
checkSupabaseConnection().then(connected => {
  if (connected) {
    console.log("✅ Supabase is connected and working");
  } else {
    console.error("❌ Could not connect to Supabase - check your network and credentials");
  }
});

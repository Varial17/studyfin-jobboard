
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nluwegaxtjekbpccjuxt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sdXdlZ2F4dGpla2JwY2NqdXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1NDQxMzEsImV4cCI6MjA1NjEyMDEzMX0.ZEE901-T8RfG8JVY5Q5umChmaZpmDM9BRpE3db8s5YQ";

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'studyfin-auth-key',
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'studyfin-web-app',
      },
    },
  }
);

// Simple connection status tracker
let connectionStatus = {
  isConnected: true,
  lastChecked: Date.now(),
  lastError: null as Error | null,
  retryCount: 0,
  maxRetries: 3
};

// Check Supabase connection with a lightweight query
export const checkSupabaseConnection = async (forceCheck = false) => {
  // If we checked recently and connection is good, use cached result
  const now = Date.now();
  if (!forceCheck && 
      connectionStatus.lastChecked && 
      (now - connectionStatus.lastChecked < 30000) && // 30 seconds cache
      connectionStatus.isConnected) {
    console.log("Using cached connection status: Connected");
    return true;
  }
  
  try {
    console.log("Testing Supabase connection...");
    connectionStatus.lastChecked = now;
    
    // First check if we have a valid session
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Use a very lightweight request to test connection
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error("Supabase connection test failed:", error);
      
      // Check if this is an auth error, which might indicate we need to refresh the token
      if (error.code === '401' && sessionData.session) {
        console.log("Auth error detected, attempting to refresh session...");
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error("Failed to refresh session:", refreshError);
          connectionStatus.isConnected = false;
          connectionStatus.lastError = error;
          return false;
        }
        
        console.log("Session refreshed, retrying connection test...");
        const { error: retryError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        
        if (retryError) {
          console.error("Connection test failed after session refresh:", retryError);
          connectionStatus.isConnected = false;
          connectionStatus.lastError = retryError;
          return false;
        }
      } else {
        connectionStatus.isConnected = false;
        connectionStatus.lastError = error;
        return false;
      }
    }
    
    console.log("Supabase connection test successful");
    connectionStatus.isConnected = true;
    connectionStatus.lastError = null;
    connectionStatus.retryCount = 0;
    return true;
  } catch (error) {
    console.error("Critical Supabase connection error:", error);
    connectionStatus.isConnected = false;
    connectionStatus.lastError = error instanceof Error ? error : new Error(String(error));
    return false;
  }
};

// Reset connection stats and retry
export const resetConnectionAndRetry = async () => {
  console.log("Resetting connection status and retrying...");
  connectionStatus = {
    lastChecked: 0,
    isConnected: false,
    lastError: null,
    retryCount: 0,
    maxRetries: 3
  };
  
  return checkSupabaseConnection(true);
};

// Get current connection status
export const getConnectionStatus = () => {
  return connectionStatus;
};

// Run an initial connection test
checkSupabaseConnection(true).then(connected => {
  if (connected) {
    console.log("✅ Supabase is connected and working");
  } else {
    console.error("❌ Could not connect to Supabase - check credentials and network");
  }
});

// Error handler helper
export const handleSupabaseError = (error: any, context: string = 'operation') => {
  console.error(`Supabase error in ${context}:`, error);
  
  return {
    message: error.message || 'An unknown error occurred',
    code: error.code || 'UNKNOWN',
    status: error.status || 500,
    isConnectionIssue: connectionStatus.isConnected === false
  };
};

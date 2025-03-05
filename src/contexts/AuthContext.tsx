
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, checkSupabaseConnection, resetConnectionAndRetry } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

type UserProfile = {
  role?: string;
  subscription_status?: string;
  subscription_id?: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  session: Session | null;
  refreshProfile: () => Promise<void>;
  connectionError: boolean;
  retryConnection: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  session: null,
  refreshProfile: async () => {},
  connectionError: false,
  retryConnection: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        if (error.code === "PGRST301" || error.message.includes("Failed to fetch")) {
          setConnectionError(true);
        }
        return null;
      }
      
      console.log("Profile data received:", data);
      setConnectionError(false);
      return data;
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      setConnectionError(true);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    console.log("Refreshing profile for user:", user.id);
    try {
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error in refreshProfile:", error);
    }
  };

  const retryConnection = async () => {
    setLoading(true);
    console.log("Retrying connection...");
    
    const connected = await checkSupabaseConnection(true);
    
    console.log("Connection retry result:", connected ? "Connected" : "Failed");
    
    if (connected) {
      setConnectionError(false);
      toast({
        title: "Connection restored",
        description: "Successfully reconnected to the database.",
      });
      await initializeAuth();
    } else {
      setConnectionError(true);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Could not connect to the database. Please check your network connection.",
      });
    }
    setLoading(false);
  };

  const initializeAuth = async () => {
    console.log("Initializing auth context - checking session");
    try {
      setLoading(true);
      
      // Check connection first
      const connected = await checkSupabaseConnection();
      if (!connected) {
        setConnectionError(true);
        setLoading(false);
        return;
      }
      
      // Get session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setConnectionError(true);
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "There was a problem connecting to the authentication service. Please try refreshing.",
        });
        setLoading(false);
        return;
      }

      const currentSession = sessionData?.session;
      console.log("Auth session check:", currentSession ? "Active session found" : "No active session");
      
      if (currentSession?.user) {
        console.log("User found in session:", currentSession.user.email);
        setUser(currentSession.user);
        setSession(currentSession);
        
        // Fetch profile for the user
        try {
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
        } catch (profileError) {
          console.error("Error fetching initial profile:", profileError);
        }
      }
    } catch (error) {
      console.error("Critical error in auth initialization:", error);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check connection and initialize auth
    initializeAuth();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession ? "session exists" : "no session");
        
        if (newSession) {
          setSession(newSession);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log("User signed in or token refreshed:", newSession.user.email);
            setUser(newSession.user);
            
            try {
              const profileData = await fetchProfile(newSession.user.id);
              setProfile(profileData);
            } catch (profileError) {
              console.error("Error fetching profile after auth state change:", profileError);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing auth state");
          setUser(null);
          setProfile(null);
          setSession(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      loading, 
      refreshProfile, 
      connectionError,
      retryConnection 
    }}>
      {connectionError && !loading && (
        <div className="bg-red-500 text-white p-2 text-center flex items-center justify-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>Connection issues detected. Some features may not work properly.</span>
          <button 
            className="px-3 py-1 bg-white text-red-600 rounded-md hover:bg-gray-100 text-sm font-medium"
            onClick={retryConnection}
          >
            Retry Connection
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

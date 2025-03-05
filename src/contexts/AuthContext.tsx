
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  session: null,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
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
        return null;
      }
      
      console.log("Profile data received:", data);
      return data;
    } catch (error) {
      console.error("Error in fetchProfile:", error);
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
      } else {
        console.log("No profile data found during refresh");
      }
    } catch (error) {
      console.error("Error in refreshProfile:", error);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    console.log("Initializing auth context");
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        // Get session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          toast({
            variant: "destructive",
            title: "Authentication error",
            description: "There was a problem connecting to the authentication service.",
          });
          setLoading(false);
          return;
        }

        // Debug URL info to help troubleshoot redirect issues
        const urlDebug = {
          hash: window.location.hash,
          hash_params: {
            accessToken: window.location.hash.includes("access_token") 
              ? new URLSearchParams(window.location.hash.substring(1)).get("access_token")
              : null,
            tokenType: window.location.hash.includes("token_type")
              ? new URLSearchParams(window.location.hash.substring(1)).get("token_type")
              : null,
            error: window.location.hash.includes("error")
              ? new URLSearchParams(window.location.hash.substring(1)).get("error")
              : null,
            errorDescription: window.location.hash.includes("error_description")
              ? new URLSearchParams(window.location.hash.substring(1)).get("error_description")
              : null,
          },
          search: window.location.search,
          search_params: {
            token: new URLSearchParams(window.location.search).get("token"),
            type: new URLSearchParams(window.location.search).get("type"),
            emailFromUrl: new URLSearchParams(window.location.search).get("email"),
            isResetMode: window.location.search.includes("type=recovery"),
          },
        };
        console.log("URL Debug:", urlDebug);
        
        const currentSession = data?.session;
        console.log("Auth session check:", currentSession ? "Active session found" : "No active session");
        setSession(currentSession);
        
        if (currentSession?.user) {
          setUser(currentSession.user);
          
          // Fetch profile
          try {
            const profileData = await fetchProfile(currentSession.user.id);
            setProfile(profileData);
          } catch (profileError) {
            console.error("Error fetching initial profile:", profileError);
          }
        }
      } catch (error) {
        console.error("Error in auth initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (login, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession ? "session exists" : "no session");
        
        setSession(newSession);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
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
          setUser(null);
          setProfile(null);
          setSession(null);
          console.log("User signed out, cleared auth state");
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

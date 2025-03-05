
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
    const initializeAuth = async () => {
      console.log("Initializing auth context - checking session");
      try {
        setLoading(true);
        
        // Get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
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
        } else {
          console.log("No user in current session");
        }
      } catch (error) {
        console.error("Critical error in auth initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (login, sign out, etc.)
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

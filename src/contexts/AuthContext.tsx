
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
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
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
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
        const { data: { session }, error } = await supabase.auth.getSession();
        
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
        
        console.log("Auth session check:", session ? "Active session found" : "No active session");
        
        if (session?.user) {
          setUser(session.user);
          
          // Fetch profile
          try {
            const profileData = await fetchProfile(session.user.id);
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
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user);
            try {
              const profileData = await fetchProfile(session.user.id);
              setProfile(profileData);
            } catch (profileError) {
              console.error("Error fetching profile after auth state change:", profileError);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

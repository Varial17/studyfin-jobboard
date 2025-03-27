
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // Also refresh the profile information in local storage to ensure 
      // role changes are reflected immediately
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('role, subscription_status')
          .eq('id', session.user.id)
          .single();
          
        if (data) {
          // Store the user role in local storage for quick access
          localStorage.setItem('userRole', data.role);
          localStorage.setItem('subscriptionStatus', data.subscription_status || '');
        }
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        console.log("AuthContext: Initializing auth");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("AuthContext: Session found", { hasSession: !!session, userId: session?.user?.id });
        setUser(session?.user ?? null);
        
        // Get profile information for role
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('role, subscription_status')
            .eq('id', session.user.id)
            .single();
            
          if (data) {
            // Store the user role in local storage for quick access
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('subscriptionStatus', data.subscription_status || '');
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (login, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("AuthContext: Auth state changed", { 
        event: _event, 
        hasSession: !!session, 
        userId: session?.user?.id 
      });
      setUser(session?.user ?? null);
      
      // Also update role information when auth state changes
      if (session?.user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('role, subscription_status')
            .eq('id', session.user.id)
            .single();
            
          if (data) {
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('subscriptionStatus', data.subscription_status || '');
          }
        } catch (error) {
          console.error("Error getting user role:", error);
        }
      } else {
        // Clear role information when user logs out
        localStorage.removeItem('userRole');
        localStorage.removeItem('subscriptionStatus');
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

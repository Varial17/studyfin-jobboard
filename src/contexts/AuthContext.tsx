
import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  userRole: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  userRole: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // Also refresh the profile information in local storage to ensure 
      // role changes are reflected immediately
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, subscription_status')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }
          
        if (data) {
          // Store the user role in local storage for quick access
          localStorage.setItem('userRole', data.role || 'applicant');
          localStorage.setItem('subscriptionStatus', data.subscription_status || '');
          setUserRole(data.role || 'applicant');
        }
      } else {
        // Clear role information when user is not logged in
        localStorage.removeItem('userRole');
        localStorage.removeItem('subscriptionStatus');
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
      setUserRole(null);
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
          const { data, error } = await supabase
            .from('profiles')
            .select('role, subscription_status')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error("Error fetching profile:", error);
            return;
          }
            
          if (data) {
            // Store the user role in local storage for quick access
            const role = data.role || 'applicant';
            localStorage.setItem('userRole', role);
            localStorage.setItem('subscriptionStatus', data.subscription_status || '');
            setUserRole(role);
            console.log("AuthContext: User role set to", role);
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
        setUser(null);
        setUserRole(null);
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
          const { data, error } = await supabase
            .from('profiles')
            .select('role, subscription_status')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error("Error fetching profile:", error);
            return;
          }
            
          if (data) {
            const role = data.role || 'applicant';
            localStorage.setItem('userRole', role);
            localStorage.setItem('subscriptionStatus', data.subscription_status || '');
            setUserRole(role);
            console.log("AuthContext: User role updated to", role);
          }
        } catch (error) {
          console.error("Error getting user role:", error);
        }
      } else {
        // Clear role information when user logs out
        localStorage.removeItem('userRole');
        localStorage.removeItem('subscriptionStatus');
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, userRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileSidebar } from "@/components/ProfileSidebar";

// Admin email that's allowed to access Zoho features
const ADMIN_EMAIL = "admin@yourdomain.com"; // Replace with your email

const ZohoIntegration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      console.log("ZohoIntegration: Auth state", { user, userExists: !!user, userId: user?.id });
      
      if (!user) {
        console.log("ZohoIntegration: No user found, redirecting to auth");
        navigate('/auth');
        return;
      }

      // Check if this user is the admin
      if (user.email !== ADMIN_EMAIL) {
        console.log("ZohoIntegration: User is not authorized to access Zoho features");
        toast({
          title: "Access Denied",
          description: "You are not authorized to access Zoho integration features",
          variant: "destructive",
        });
        navigate('/profile');
        return;
      }

      try {
        console.log("ZohoIntegration: Fetching profile for user", user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('role, zoho_connected')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setError(error.message);
          setLoading(false);
          return;
        }

        console.log("ZohoIntegration: Profile data", data);
        setUserRole(data?.role || null);
        setConnected(data?.zoho_connected || false);
      } catch (error: any) {
        console.error('Error fetching user role:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, navigate, toast]);

  const initiateZohoConnection = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to connect to Zoho CRM",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    try {
      console.log("ZohoIntegration: Initiating Zoho connection");
      // Call Supabase Edge Function to get the authorization URL
      const { data, error } = await supabase.functions.invoke('zoho-auth', {
        body: { 
          redirectUrl: `${window.location.origin}/auth/zoho/callback`
        }
      });

      if (error) throw error;
      
      console.log("ZohoIntegration: Received auth URL", data);
      // Redirect to Zoho authorization page
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error('Error initiating Zoho connection:', error);
      toast({
        title: "Error",
        description: "Failed to connect to Zoho CRM. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disconnectZoho = async () => {
    if (!user) {
      toast({
        title: "Error", 
        description: "You must be logged in to disconnect from Zoho CRM",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    try {
      setLoading(true);
      
      console.log("ZohoIntegration: Disconnecting from Zoho");
      // Call Supabase Edge Function to revoke token
      const { error: revokeError } = await supabase.functions.invoke('zoho-disconnect', {
        body: { userId: user.id }
      });

      if (revokeError) throw revokeError;
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ zoho_connected: false })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setConnected(false);
      toast({
        title: "Success",
        description: "Successfully disconnected from Zoho CRM",
      });
    } catch (error: any) {
      console.error('Error disconnecting Zoho:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect from Zoho CRM. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button className="mt-4" onClick={() => navigate('/profile')}>Go Back to Profile</Button>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <ProfileSidebar />
          <div className="flex-1 max-w-3xl">
            <h1 className="text-2xl font-semibold mb-6">Zoho CRM Integration</h1>
            
            <Card>
              <CardHeader>
                <CardTitle>Connect to Zoho CRM</CardTitle>
                <CardDescription>
                  System integration with Zoho CRM to automatically sync user data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connected ? (
                  <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
                    <AlertTitle>Connected to Zoho CRM</AlertTitle>
                    <AlertDescription>
                      <p>The system is currently connected to Zoho CRM.</p>
                      <p className="mt-2">New applicants and job applications will automatically be synced to Zoho CRM.</p>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertTitle>Not Connected</AlertTitle>
                    <AlertDescription>
                      <p>The system is not connected to Zoho CRM.</p>
                      <p className="mt-2">As an administrator, you need to connect the system to Zoho CRM to enable automatic syncing of user data.</p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                {connected ? (
                  <>
                    <Button variant="destructive" onClick={disconnectZoho} disabled={loading}>
                      Disconnect from Zoho CRM
                    </Button>
                    <Button onClick={() => navigate('/profile/zoho/admin')}>
                      Go to Zoho Admin Panel
                    </Button>
                  </>
                ) : (
                  <Button onClick={initiateZohoConnection} disabled={loading}>
                    Connect to Zoho CRM
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZohoIntegration;

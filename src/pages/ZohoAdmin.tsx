
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

const ZohoAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isZohoConnected, setIsZohoConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      console.log("ZohoAdmin: Auth state", { user, userExists: !!user, userId: user?.id });
      
      if (!user) {
        console.log("ZohoAdmin: No user found, redirecting to auth");
        navigate('/auth');
        return;
      }

      try {
        console.log("ZohoAdmin: Fetching profile for user", user.id);
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

        console.log("ZohoAdmin: Profile data", data);
        setUserRole(data?.role || null);
        setIsZohoConnected(data?.zoho_connected || false);
        
        // Redirect if user is not an employer
        if (data?.role !== 'employer') {
          console.log("ZohoAdmin: User is not an employer, redirecting to profile");
          toast({
            title: "Access Denied",
            description: "Only employers can access Zoho CRM admin features",
            variant: "destructive",
          });
          navigate('/profile');
          return;
        }
        
        // Redirect if not connected to Zoho
        if (!data?.zoho_connected) {
          console.log("ZohoAdmin: User not connected to Zoho, redirecting to Zoho integration");
          toast({
            title: "Not Connected",
            description: "Please connect to Zoho CRM first",
            variant: "destructive",
          });
          navigate('/profile/zoho');
          return;
        }
      } catch (error: any) {
        console.error('Error fetching user role:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, navigate, toast]);

  const syncAllUsersToZoho = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to sync users to Zoho CRM",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    try {
      setSyncing(true);
      
      console.log("ZohoAdmin: Syncing all users to Zoho");
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('sync-all-users-to-zoho', {
        body: { employerId: user.id }
      });
      
      if (error) throw error;
      
      console.log("ZohoAdmin: Sync response", data);
      setResult(data);
      
      toast({
        title: "Success",
        description: data.message,
      });
    } catch (error: any) {
      console.error('Error syncing users to Zoho:', error);
      setResult({
        success: false,
        message: error.message || "Failed to sync users to Zoho CRM",
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to sync users to Zoho CRM",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
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
            <h1 className="text-2xl font-semibold mb-6">Zoho CRM Admin</h1>
            
            <Card>
              <CardHeader>
                <CardTitle>Sync All Users to Zoho CRM</CardTitle>
                <CardDescription>
                  This will add all existing applicants to your Zoho CRM as leads.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result && (
                  <Alert className={`${result.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900'} mb-4`}>
                    <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>
                      {result.message}
                      {result.count !== undefined && (
                        <div className="mt-2">
                          <strong>Total users synced:</strong> {result.count}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Warning: This operation might take some time depending on the number of users in the system.
                  Running this multiple times may create duplicate leads in Zoho CRM.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={syncAllUsersToZoho} 
                  disabled={syncing}
                >
                  {syncing ? "Syncing..." : "Sync All Users to Zoho CRM"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZohoAdmin;

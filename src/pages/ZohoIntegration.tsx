
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
  const [connected, setConnected] = useState(true); // Default to true since we assume the system is connected
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
          .select('role')
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
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching user role:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, navigate, toast]);

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
                <CardTitle>Zoho CRM System Integration</CardTitle>
                <CardDescription>
                  System-wide integration with Zoho CRM to automatically sync user data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
                  <AlertTitle>System Connected to Zoho CRM</AlertTitle>
                  <AlertDescription>
                    <p>The job platform is connected to your Zoho CRM.</p>
                    <p className="mt-2">All user data is automatically synced to your CRM, including:</p>
                    <ul className="list-disc ml-6 mt-2">
                      <li>New user registrations</li>
                      <li>Job applications</li>
                      <li>User profile updates</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <Button onClick={() => navigate('/profile/zoho/admin')}>
                  Go to Zoho Admin Panel
                </Button>
                <p className="text-sm text-muted-foreground">
                  The admin panel allows you to sync all existing users to Zoho CRM
                  and view detailed integration status.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZohoIntegration;

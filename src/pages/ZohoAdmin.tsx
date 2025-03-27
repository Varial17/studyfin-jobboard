
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ExternalLink } from "lucide-react";

// Admin email that's allowed to access Zoho features
const ADMIN_EMAIL = "admin@yourdomain.com"; // Replace with your email

const ZohoAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentUsers, setRecentUsers] = useState<Array<{id: string, created_at: string, full_name: string | null}>>([]);

  useEffect(() => {
    const checkUserRole = async () => {
      console.log("ZohoAdmin: Auth state", { user, userExists: !!user, userId: user?.id });
      
      if (!user) {
        console.log("ZohoAdmin: No user found, redirecting to auth");
        navigate('/auth');
        return;
      }

      // Check if this user is the admin
      if (user.email !== ADMIN_EMAIL) {
        console.log("ZohoAdmin: User is not authorized to access Zoho features");
        toast({
          title: "Access Denied",
          description: "You are not authorized to access Zoho administration features",
          variant: "destructive",
        });
        navigate('/profile');
        return;
      }

      try {
        console.log("ZohoAdmin: Fetching profile for user", user.id);
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

        // Fetch most recent users
        // We need to join with auth.users to get email since it's not in profiles table
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, created_at, full_name')
          .eq('role', 'applicant')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else {
          setRecentUsers(usersData || []);
        }

        console.log("ZohoAdmin: Profile data", data);
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
      
      console.log("ZohoAdmin: Syncing all users to Zoho", { userId: user.id });
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('sync-all-users-to-zoho', {
        body: { employerId: user.id }
      });
      
      console.log("ZohoAdmin: Edge function response", { data, error });
      
      if (error) {
        console.error("ZohoAdmin: Edge function error", error);
        throw error;
      }
      
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
          <div className="flex-1 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold">Zoho CRM Admin</h1>
              <Button 
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => window.open('https://crm.zoho.com', '_blank')}
              >
                Open Zoho CRM <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>System Integration Status</CardTitle>
                <CardDescription>
                  Information about the current Zoho CRM integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900 mb-4">
                  <AlertTitle>Connected to Zoho CRM</AlertTitle>
                  <AlertDescription>
                    <p>The system is connected to Zoho CRM and automatically syncs:</p>
                    <ul className="list-disc ml-6 mt-2">
                      <li>New user registrations</li>
                      <li>Job applications</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>
                  The most recent users who have registered in the system and been synced to Zoho CRM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Registration Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.length > 0 ? (
                      recentUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4">No users found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sync All Users to Zoho CRM</CardTitle>
                <CardDescription>
                  This will add all existing users to your Zoho CRM as leads, ensuring your CRM has a complete record.
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
                  This is useful if you've just set up the integration or suspect some users weren't synced automatically.
                  Running this multiple times may create duplicate leads in Zoho CRM if deduplication is not enabled.
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

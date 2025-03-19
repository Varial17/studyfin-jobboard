
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

const ZohoCallback = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const handleCallback = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        console.error('Error during Zoho authorization:', error);
        setStatus("error");
        toast({
          title: "Error",
          description: "Failed to connect to Zoho CRM. Please try again.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/profile/zoho'), 3000);
        return;
      }

      if (!code) {
        setStatus("error");
        toast({
          title: "Error",
          description: "No authorization code received from Zoho",
          variant: "destructive",
        });
        setTimeout(() => navigate('/profile/zoho'), 3000);
        return;
      }

      try {
        // Exchange the code for tokens
        const { data, error: tokenError } = await supabase.functions.invoke('zoho-callback', {
          body: { 
            code,
            redirectUrl: `https://jobs.studyfin.com.au/auth/zoho/callback`,
            userId: user.id
          }
        });

        if (tokenError) throw tokenError;

        if (!data.success) {
          throw new Error(data.message || "Failed to exchange authorization code");
        }

        // Update user profile to indicate Zoho is connected
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ zoho_connected: true })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setStatus("success");
        toast({
          title: "Success",
          description: "Successfully connected to Zoho CRM",
        });
        setTimeout(() => navigate('/profile/zoho'), 3000);
      } catch (error: any) {
        console.error('Error processing Zoho callback:', error);
        setStatus("error");
        toast({
          title: "Error",
          description: error.message || "Failed to connect to Zoho CRM",
          variant: "destructive",
        });
        setTimeout(() => navigate('/profile/zoho'), 3000);
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [user, navigate, location.search, toast]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            {status === "loading" && <p>Processing your Zoho CRM connection...</p>}
            {status === "success" && <p>Successfully connected to Zoho CRM! Redirecting...</p>}
            {status === "error" && <p>Failed to connect to Zoho CRM. Redirecting...</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ZohoCallback;

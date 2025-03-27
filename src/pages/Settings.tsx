import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Save, CreditCard, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PricingSectionDemo } from "@/components/ui/pricing-section-demo";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    role: "applicant",
    subscription_status: null,
    subscription_id: null
  });
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [manageSubscriptionLoading, setManageSubscriptionLoading] = useState(false);
  const [stripeRedirectHandled, setStripeRedirectHandled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    const handleStripeRedirect = async () => {
      const url = new URL(window.location.href);
      const success = url.searchParams.get('success');
      const sessionId = url.searchParams.get('session_id');
      
      if (success === 'true' && sessionId) {
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (user) {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("role, subscription_status, subscription_id")
              .eq("id", user.id)
              .single();
            
            if (error) throw error;
            
            if (data) {
              setProfile({
                role: data.role || "applicant",
                subscription_status: data.subscription_status,
                subscription_id: data.subscription_id
              });
              
              toast({
                title: t("success"),
                description: "Your employer subscription is now active. You can post unlimited job listings.",
              });
            }
          } catch (error) {
            console.error("Error fetching updated profile:", error);
            setError("Failed to update profile information. Please refresh the page.");
          }
        }
      } else if (success === 'false') {
        toast({
          variant: "destructive",
          title: "Subscription Not Completed",
          description: "Your subscription was not completed. You remain on the free plan.",
        });
        
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      setStripeRedirectHandled(true);
    };
    
    if (!stripeRedirectHandled) {
      handleStripeRedirect();
    }
  }, [user, toast, stripeRedirectHandled, t]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const getProfile = async () => {
      try {
        setError(null);
        const { data, error } = await supabase
          .from("profiles")
          .select("role, subscription_status, subscription_id")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (data) {
          setProfile({
            role: data.role || "applicant",
            subscription_status: data.subscription_status,
            subscription_id: data.subscription_id
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load user profile. Please refresh the page.");
        toast({
          variant: "destructive",
          title: t("error"),
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [user, navigate, toast, t]);

  const handleSave = async () => {
    if (!user) return;

    if (profile.role === "employer" && profile.subscription_status !== "active") {
      setShowSubscriptionDialog(true);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: profile.role
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: t("success"),
        description: t("settingsUpdated"),
      });
    } catch (error) {
      setError("Failed to save settings. Please try again.");
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) return;
    
    setCheckoutLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      console.log("Calling Stripe subscription endpoint...");
      
      const response = await supabase.functions.invoke('stripe-subscription', {
        body: JSON.stringify({
          user_id: user.email,
          return_url: `${window.location.origin}/settings`
        })
      });
      
      console.log("Response from Stripe:", response);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }
      
      if (!response.data?.url) {
        throw new Error("Invalid response from server. Missing checkout URL.");
      }
      
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      
      let errorMessage = error.message || "Unknown error";
      let details = error.details || null;
      
      setError(errorMessage);
      
      if (details) {
        setDebugInfo(details);
      }
      
      setCheckoutLoading(false);
      toast({
        variant: "destructive",
        title: t("error"),
        description: "Failed to start checkout process. Please see the error details above."
      });
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setManageSubscriptionLoading(true);
    setError(null);
    try {
      const response = await supabase.functions.invoke('stripe-subscription/customer-portal', {
        body: JSON.stringify({
          user_id: user.email,
          return_url: `${window.location.origin}/settings`
        })
      });

      if (response.error) {
        throw new Error(response.error.message || response.error || "Failed to access subscription management");
      }
      
      if (!response.data?.url) {
        throw new Error("Invalid response from server. Missing portal URL.");
      }
      
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Manage subscription error:", error);
      setError(`Failed to access subscription management: ${error.message || "Unknown error"}`);
      setManageSubscriptionLoading(false);
      toast({
        variant: "destructive",
        title: t("error"),
        description: "Failed to access subscription management. Please try again or contact support."
      });
    }
  };

  const handleRoleChange = (value) => {
    if (value === "employer" && profile.subscription_status !== "active") {
      setShowSubscriptionDialog(true);
    } else {
      setProfile({ ...profile, role: value });
    }
  };

  const handleEmployerSelect = () => {
    setProfile({ ...profile, role: "employer" });
    setShowSubscriptionDialog(true);
  };

  const handlePricingAction = (action: "selectFree" | "checkout", tier: any) => {
    if (action === "selectFree") {
      setProfile({ ...profile, role: "applicant" });
      handleSave();
    } else if (action === "checkout") {
      handleEmployerSelect();
    }
  };

  const closeDialog = () => {
    setShowSubscriptionDialog(false);
    setProfile(prev => ({ ...prev, role: "applicant" }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-lg">{t("loading")}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <ProfileSidebar />
          <div className="flex-1 max-w-4xl space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {debugInfo && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Debug Information</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap overflow-auto max-h-32">
                  {debugInfo}
                </AlertDescription>
              </Alert>
            )}
            
            {profile.subscription_status === "active" && (
              <Card>
                <CardContent className="pt-6 mt-2">
                  <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>You have an active employer subscription</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleManageSubscription}
                      disabled={manageSubscriptionLoading}
                      className="ml-auto"
                    >
                      {manageSubscriptionLoading ? "Loading..." : "Manage Subscription"}
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? t("saving") : t("saveSettings")}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {profile.subscription_status !== "active" && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Choose Your Account Type</h2>
                <p className="text-muted-foreground mb-6">
                  Select the account type that best suits your needs
                </p>
                
                <PricingSectionDemo onAction={handlePricingAction} />
                
                <Card className="mt-8">
                  <CardFooter className="justify-end pt-6">
                    <Button
                      onClick={handleSave}
                      disabled={saving || profile.role === "employer"}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? t("saving") : "Save as Job Seeker"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Employer Subscription Required</DialogTitle>
            <DialogDescription>
              A subscription is required to access employer features, including posting unlimited job listings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg border p-4">
              <div className="font-medium">Employer Subscription</div>
              <div className="text-2xl font-bold mt-2">$50/month</div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Post unlimited job listings
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Access to all applicant profiles
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Premium analytics dashboard
                </li>
              </ul>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? "Processing..." : "Subscribe Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;

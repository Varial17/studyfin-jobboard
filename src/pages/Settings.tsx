
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Save, CreditCard, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";

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

  // Handle Stripe redirect on component mount
  useEffect(() => {
    const handleStripeRedirect = async () => {
      const url = new URL(window.location.href);
      const success = url.searchParams.get('success');
      const sessionId = url.searchParams.get('session_id');
      
      if (success === 'true' && sessionId) {
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Refresh the profile to get updated subscription status
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
                title: "Subscription Active",
                description: "Your employer subscription is now active. You can post unlimited job listings.",
              });
            }
          } catch (error) {
            console.error("Error fetching updated profile:", error);
          }
        }
      } else if (success === 'false') {
        // Subscription was not completed
        toast({
          variant: "destructive",
          title: "Subscription Not Completed",
          description: "Your subscription was not completed. You remain on the free plan.",
        });
        
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Mark redirect as handled
      setStripeRedirectHandled(true);
    };
    
    // Only handle redirect if not already handled
    if (!stripeRedirectHandled) {
      handleStripeRedirect();
    }
  }, [user, toast, stripeRedirectHandled]);

  // Load user profile
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const getProfile = async () => {
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
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
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

    // If user is trying to switch to employer role and doesn't have an active subscription
    if (profile.role === "employer" && profile.subscription_status !== "active") {
      setShowSubscriptionDialog(true);
      return;
    }

    setSaving(true);
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
    try {
      const response = await supabase.functions.invoke('stripe-subscription', {
        body: JSON.stringify({
          user_id: user.id,
          return_url: `${window.location.origin}/settings`
        })
      });

      if (response.error) throw new Error(response.error);
      
      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: "Failed to start checkout process. Please try again."
      });
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setManageSubscriptionLoading(true);
    try {
      const response = await supabase.functions.invoke('stripe-subscription/customer-portal', {
        body: JSON.stringify({
          user_id: user.email,
          return_url: `${window.location.origin}/settings`
        })
      });

      if (response.error) throw new Error(response.error);
      
      // Redirect to Stripe Customer Portal
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Manage subscription error:", error);
      toast({
        variant: "destructive",
        title: t("error"),
        description: "Failed to access subscription management. Please try again."
      });
      setManageSubscriptionLoading(false);
    }
  };

  const handleRoleChange = (value) => {
    // If changing to employer and no active subscription, don't update yet
    if (value === "employer" && profile.subscription_status !== "active") {
      setShowSubscriptionDialog(true);
    } else {
      setProfile({ ...profile, role: value });
    }
  };

  const closeDialog = () => {
    setShowSubscriptionDialog(false);
    // Reset role selection if they cancel
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
        <div className="flex gap-6">
          <ProfileSidebar />
          <div className="flex-1 max-w-4xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("accountSettings")}</CardTitle>
                <CardDescription>{t("manageAccountSettings")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-base">{t("accountType")}</h3>
                  
                  {profile.subscription_status === "active" && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center space-x-2">
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
                  )}
                  
                  {profile.subscription_status === "past_due" && (
                    <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-md flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>Your subscription payment is past due. Please update your payment method.</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleManageSubscription}
                        disabled={manageSubscriptionLoading}
                        className="ml-auto"
                      >
                        {manageSubscriptionLoading ? "Loading..." : "Update Payment"}
                      </Button>
                    </div>
                  )}
                  
                  <RadioGroup
                    value={profile.role}
                    onValueChange={handleRoleChange}
                    className="flex flex-col space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="applicant" id="applicant" />
                      <Label htmlFor="applicant">{t("jobSeeker")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="employer" id="employer" />
                      <Label htmlFor="employer">
                        {t("employer")} 
                        {profile.subscription_status !== "active" && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            (Requires subscription - $29/month)
                          </span>
                        )}
                      </Label>
                    </div>
                  </RadioGroup>
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
          </div>
        </div>
      </div>
      
      {/* Subscription Dialog */}
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
              <div className="text-2xl font-bold mt-2">$29/month</div>
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

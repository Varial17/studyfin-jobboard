
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { useToast } from "@/components/ui/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { StatusAlerts } from "@/components/settings/StatusAlerts";
import { ActiveSubscriptionCard } from "@/components/settings/ActiveSubscriptionCard";
import { AccountTypeSelector } from "@/components/settings/AccountTypeSelector";
import { SubscriptionDialog } from "@/components/settings/SubscriptionDialog";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { error, debugInfo, setError, setDebugInfo, updateProfileAfterSubscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    role: "applicant",
    subscription_status: null,
    subscription_id: null
  });
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [stripeRedirectHandled, setStripeRedirectHandled] = useState(false);

  useEffect(() => {
    const handleStripeRedirect = async () => {
      const url = new URL(window.location.href);
      const success = url.searchParams.get('success');
      const sessionId = url.searchParams.get('session_id');
      
      if (success === 'true' && sessionId) {
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (user) {
          try {
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                role: "employer", 
                subscription_status: "active"
              })
              .eq("id", user.id);
            
            if (updateError) throw updateError;

            const { data, error } = await supabase
              .from("profiles")
              .select("role, subscription_status, subscription_id")
              .eq("id", user.id)
              .single();
            
            if (error) throw error;
            
            if (data) {
              setProfile({
                role: data.role || "employer",
                subscription_status: data.subscription_status,
                subscription_id: data.subscription_id
              });
              
              toast({
                title: t("success"),
                description: "Your employer subscription is now active. You can post unlimited job listings.",
              });
            }
          } catch (error) {
            console.error("Error updating profile after checkout:", error);
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
  }, [user, toast, stripeRedirectHandled, t, setError]);

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
  }, [user, navigate, toast, t, setError]);

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

  const handleSubscriptionSuccess = async () => {
    const success = await updateProfileAfterSubscription();
    if (success) {
      setShowSubscriptionDialog(false);
      setProfile(prev => ({
        ...prev,
        role: "employer",
        subscription_status: "active"
      }));
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
            <StatusAlerts error={error} debugInfo={debugInfo} />
            
            {profile.subscription_status === "active" ? (
              <ActiveSubscriptionCard 
                onSave={handleSave} 
                saving={saving} 
              />
            ) : (
              <AccountTypeSelector 
                onSave={handleSave}
                saving={saving}
                onAction={handlePricingAction}
                disableSave={profile.role === "employer"}
              />
            )}
          </div>
        </div>
      </div>
      
      <SubscriptionDialog 
        open={showSubscriptionDialog} 
        onOpenChange={setShowSubscriptionDialog}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
};

export default Settings;

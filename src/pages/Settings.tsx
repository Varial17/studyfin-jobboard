import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, CreditCard } from "lucide-react";
import { RoleSelectionSection } from "@/components/profile/RoleSelectionSection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const Settings = () => {
  const { user, profile, refreshProfile, connectionError } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [profileData, setProfileData] = useState({
    role: profile?.role || "applicant",
    subscription_status: profile?.subscription_status || null,
    subscription_id: profile?.subscription_id || null,
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        role: profile.role || "applicant",
        subscription_status: profile.subscription_status || null,
        subscription_id: profile.subscription_id || null,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to save settings.",
      });
      return;
    }
    
    if (connectionError) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Cannot save settings due to connection issues. Please try again when connection is restored.",
      });
      return;
    }

    setSaving(true);
    try {
      // Only save the role if they're downgrading to applicant or if they have an active subscription
      const canChangeToEmployer = 
        profileData.role === "applicant" || 
        profile?.subscription_status === "active";
      
      const dataToUpdate = {
        role: canChangeToEmployer ? profileData.role : "applicant",
      };

      const { error } = await supabase
        .from("profiles")
        .update(dataToUpdate)
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: t("success"),
        description: t("settingsUpdated"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    // Implementation for subscription management portal would go here
    toast({
      title: "Coming Soon",
      description: "Subscription management will be available soon.",
    });
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  const hasSubscription = profileData.subscription_status === "active";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <ProfileSidebar />
          <div className="flex-1 max-w-4xl space-y-6">
            <h1 className="text-2xl font-bold mb-6">{t("settings")}</h1>
            
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
                <h2 className="text-xl font-semibold">{t("accountSettings")}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t("accountSettingsDesc")}
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                {hasSubscription && (
                  <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Active Subscription
                      </CardTitle>
                      <CardDescription className="text-green-600 dark:text-green-400">
                        Your employer account is active and you can post jobs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 border-green-300 text-green-700"
                        onClick={handleManageSubscription}
                        disabled={isManagingSubscription}
                      >
                        {isManagingSubscription ? "Loading..." : "Manage Subscription"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                <RoleSelectionSection 
                  profile={profileData} 
                  setProfile={setProfileData} 
                />
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? t("saving") : t("saveSettings")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

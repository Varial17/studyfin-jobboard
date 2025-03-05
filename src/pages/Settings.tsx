
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Save } from "lucide-react";
import { RoleSelectionSection } from "@/components/profile/RoleSelectionSection";

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    role: profile?.role || "applicant",
  });

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: profileData.role,
        })
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

  if (!user) {
    navigate("/auth");
    return null;
  }

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

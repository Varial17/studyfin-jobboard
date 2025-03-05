
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase, checkSupabaseConnection } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, AlertTriangle } from "lucide-react";
import { BasicInfoSection } from "@/components/profile/BasicInfoSection";
import { ContactInfoSection } from "@/components/profile/ContactInfoSection";
import { EducationSection } from "@/components/profile/EducationSection";
import { ProfessionalInfoSection } from "@/components/profile/ProfessionalInfoSection";

const Profile = () => {
  const { user, loading: authLoading, connectionError } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    title: "",
    bio: "",
    location: "",
    phone_number: "",
    website: "",
    university: "",
    field_of_study: "",
    graduation_year: "",
    student_status: "",
    cv_url: "",
    github_url: "",
    linkedin_url: "",
  });

  useEffect(() => {
    // Redirect if not logged in and auth loading is complete
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    const getProfile = async () => {
      if (!user) return;
      
      try {
        setLoadError(null);
        setLoading(true);
        
        // Check connection first
        const connected = await checkSupabaseConnection();
        if (!connected) {
          setLoadError("Could not connect to the database. Please check your network connection.");
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          setLoadError(`Error loading profile: ${error.message}`);
          toast({
            variant: "destructive",
            title: t("error"),
            description: error.message,
          });
          return;
        }
        
        if (data) {
          setProfile({
            ...profile,
            full_name: data.full_name || "",
            title: data.title || "",
            bio: data.bio || "",
            location: data.location || "",
            phone_number: data.phone_number || "",
            website: data.website || "",
            university: data.university || "",
            field_of_study: data.field_of_study || "",
            graduation_year: data.graduation_year ? data.graduation_year.toString() : "",
            student_status: data.student_status || "",
            cv_url: data.cv_url || "",
            github_url: data.github_url || "",
            linkedin_url: data.linkedin_url || "",
          });
        }
      } catch (error: any) {
        console.error("Error in getProfile:", error);
        setLoadError(`Unexpected error: ${error.message}`);
        toast({
          variant: "destructive",
          title: t("error"),
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      getProfile();
    }
  }, [user, authLoading, navigate, toast, t]);

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file || !user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('cvs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cvs')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cv_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, cv_url: publicUrl });
      toast({
        title: t("success"),
        description: t("cvUploaded"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Check connection first
      const connected = await checkSupabaseConnection();
      if (!connected) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: "Could not connect to the database. Please check your network connection.",
        });
        setSaving(false);
        return;
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({
          ...profile,
          graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: t("success"),
        description: t("profileUpdated"),
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <span className="text-lg">{t("loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || connectionError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">{loadError || "Could not connect to the database. Please check your network connection."}</p>
            <Button 
              onClick={() => window.location.reload()}
              variant="default"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <ProfileSidebar />
          <div className="flex-1 max-w-4xl space-y-6">
            <BasicInfoSection profile={profile} setProfile={setProfile} />
            <ContactInfoSection
              profile={profile}
              setProfile={setProfile}
              userEmail={user?.email}
            />
            <EducationSection profile={profile} setProfile={setProfile} />
            <ProfessionalInfoSection
              profile={profile}
              setProfile={setProfile}
              uploading={uploading}
              handleCVUpload={handleCVUpload}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? t("saving") : t("saveProfile")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

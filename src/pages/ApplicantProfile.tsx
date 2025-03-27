
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { useToast } from "@/components/ui/use-toast";
import { BasicInfoSection } from "@/components/profile/BasicInfoSection";
import { ContactInfoSection } from "@/components/profile/ContactInfoSection";
import { EducationSection } from "@/components/profile/EducationSection";
import { ProfessionalInfoSection } from "@/components/profile/ProfessionalInfoSection";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";

const ApplicantProfile = () => {
  const { applicantId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    role: "applicant",
  });

  useEffect(() => {
    // Log when the component mounts for debugging
    console.log("ApplicantProfile component mounted");
    console.log("Current user:", user);
    console.log("Applicant ID:", applicantId);
    
    if (!user) {
      console.log("No user found, redirecting to auth");
      navigate("/auth");
      return;
    }

    const fetchApplicantProfile = async () => {
      try {
        setLoading(true);
        console.log("Fetching applicant profile for ID:", applicantId);
        
        if (!applicantId) {
          console.error("Missing applicant ID");
          setError("Applicant ID is missing");
          throw new Error("Applicant ID is missing");
        }
        
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", applicantId)
          .single();

        if (error) {
          console.error("Error fetching applicant profile:", error);
          setError(`Error fetching profile: ${error.message}`);
          throw error;
        }
        
        if (data) {
          console.log("Applicant profile data retrieved:", data);
          setProfile({
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
            role: data.role || "applicant",
          });
        } else {
          console.error("No profile data found");
          setError("Profile not found");
        }
      } catch (error: any) {
        console.error("Applicant profile fetch error:", error);
        setError(error.message || "Error fetching profile");
        toast({
          variant: "destructive",
          title: t("error"),
          description: error.message,
        });
      } finally {
        setLoading(false);
        console.log("Finished loading applicant profile");
      }
    };

    fetchApplicantProfile();
  }, [user, applicantId, navigate, t, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <span className="text-lg">{t("loading")}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center flex-col gap-4">
        <span className="text-lg text-red-500">{error}</span>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          {t("back")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <ProfileSidebar />
          <div className="flex-1 max-w-4xl space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{profile.full_name || t("unnamed")}</h1>
              <Badge variant={profile.role === 'applicant' ? 'default' : 'secondary'}>
                {profile.role === 'applicant' ? t('applicantRole') : t('employerRole')}
              </Badge>
            </div>
            <BasicInfoSection profile={profile} setProfile={() => {}} />
            <ContactInfoSection profile={profile} setProfile={() => {}} userEmail={""} />
            <EducationSection profile={profile} setProfile={() => {}} />
            <ProfessionalInfoSection
              profile={profile}
              setProfile={() => {}}
              uploading={false}
              handleCVUpload={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantProfile;

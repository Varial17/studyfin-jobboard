
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
import { AlertCircle } from "lucide-react";

const ApplicantProfile = () => {
  const { applicantId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempts, setFetchAttempts] = useState(0);
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
    console.log("Applicant ID from params:", applicantId);
    
    if (!user) {
      console.log("No user found, redirecting to auth");
      navigate("/auth");
      return;
    }

    const fetchApplicantProfile = async () => {
      try {
        setLoading(true);
        console.log(`Fetch attempt ${fetchAttempts + 1} for applicant profile ID:`, applicantId);
        
        if (!applicantId) {
          console.error("Missing applicant ID");
          setError("Applicant ID is missing");
          throw new Error("Applicant ID is missing");
        }
        
        // Add a small delay to ensure Supabase is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("Making Supabase query for profile:", applicantId);
        const { data, error: fetchError, status } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", applicantId)
          .single();

        console.log("Supabase response status:", status);
        
        if (fetchError) {
          console.error("Error fetching applicant profile:", fetchError);
          if (status === 406) {
            console.log("No matching profile found for ID:", applicantId);
            setError("Profile not found. The requested applicant profile does not exist.");
          } else {
            setError(`Error fetching profile: ${fetchError.message}`);
          }
          throw fetchError;
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
          console.error("No profile data found in response");
          setError("Profile not found. Please check the applicant ID.");
        }
      } catch (error: any) {
        console.error("Applicant profile fetch error:", error);
        setError(error.message || "Error fetching profile");
        
        // Only show toast on first error
        if (fetchAttempts === 0) {
          toast({
            variant: "destructive",
            title: t("error"),
            description: error.message || "Failed to load profile",
          });
        }
        
        // If we've tried a few times and still failing, give up
        if (fetchAttempts >= 2) {
          console.log("Multiple fetch attempts failed, stopping retries");
        } else {
          // Increment the fetch attempts counter
          setFetchAttempts(prev => prev + 1);
        }
      } finally {
        setLoading(false);
        console.log("Finished loading applicant profile");
      }
    };

    fetchApplicantProfile();
  }, [user, applicantId, navigate, t, toast, fetchAttempts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg">{t("loading")}...</span>
          <p className="text-sm text-muted-foreground">
            Fetching profile for user ID: {applicantId}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center flex-col gap-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <span className="text-lg font-medium">{t("error")}</span>
        </div>
        <p className="text-center max-w-md mb-4">{error}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            {t("back")}
          </button>
          <button 
            onClick={() => setFetchAttempts(prev => prev + 1)}
            className="px-4 py-2 bg-secondary text-white rounded-md"
          >
            {t("retry")}
          </button>
        </div>
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

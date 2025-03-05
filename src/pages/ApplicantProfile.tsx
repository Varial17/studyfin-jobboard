
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

type ApplicantProfileData = {
  full_name: string;
  title: string;
  bio: string;
  location: string;
  phone_number: string;
  website: string;
  university: string;
  field_of_study: string;
  graduation_year: string;
  student_status: string;
  cv_url: string;
  github_url: string;
  linkedin_url: string;
  role: string;
};

const ApplicantProfile = () => {
  const { applicantId } = useParams();
  const { user, profile: userProfile } = useAuth(); // Renamed to userProfile to avoid conflict
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfileData>({ // Renamed to applicantProfile
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
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if the user is an employer
    const isEmployer = userProfile?.role === 'employer'; // Updated to userProfile
    
    // If not an employer, redirect to settings after a short delay
    if (!isEmployer && !redirecting) {
      setRedirecting(true);
      toast({
        title: t("access_denied"),
        description: t("employer_role_required_view_applicant"),
        variant: "destructive",
      });
      
      // Short delay to allow toast to be seen before redirecting
      const timeout = setTimeout(() => {
        navigate("/profile/settings");
      }, 2000);
      
      return () => clearTimeout(timeout);
    }

    const fetchApplicantProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", applicantId)
          .single();

        if (error) throw error;
        
        if (data) {
          setApplicantProfile({ // Updated to setApplicantProfile
            ...applicantProfile, // Updated to applicantProfile
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
            // Handle the potential absence of role property
            role: (data as any).role || "applicant",
          });
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    if (isEmployer) {
      fetchApplicantProfile();
    }
  }, [user, applicantId, navigate, t, toast, userProfile?.role, redirecting, applicantProfile]); // Updated dependency array

  // Show loading or redirecting state
  if (loading && !redirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-lg">{t("loading")}</span>
      </div>
    );
  }
  
  if (redirecting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-6">
            <ProfileSidebar />
            <div className="flex-1 max-w-4xl space-y-6">
              <h1 className="text-2xl font-bold mb-6">{t("applicantProfile")}</h1>
              <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow">
                <p className="text-center py-4">{t("redirecting_to_settings")}</p>
              </div>
            </div>
          </div>
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
          <div className="flex-1 max-w-4xl space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{applicantProfile.full_name}</h1>
              <Badge variant={applicantProfile.role === 'applicant' ? 'default' : 'secondary'}>
                {applicantProfile.role === 'applicant' ? t('applicantRole') : t('employerRole')}
              </Badge>
            </div>
            <BasicInfoSection profile={applicantProfile} setProfile={() => {}} />
            <ContactInfoSection profile={applicantProfile} setProfile={() => {}} userEmail={""} />
            <EducationSection profile={applicantProfile} setProfile={() => {}} />
            <ProfessionalInfoSection
              profile={applicantProfile}
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

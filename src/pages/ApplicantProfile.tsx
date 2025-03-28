
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
import { useIsMobile } from "@/hooks/use-mobile";

const ApplicantProfile = () => {
  const { applicantId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
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
    if (!user) {
      navigate("/auth");
      return;
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

    fetchApplicantProfile();
  }, [user, applicantId, navigate, t, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-lg">{t("loading")}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row gap-6'}`}>
          <ProfileSidebar />
          <div className="flex-1 max-w-full md:max-w-4xl space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0">
              <h1 className="text-xl md:text-2xl font-bold">{profile.full_name}</h1>
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

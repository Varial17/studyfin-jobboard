
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Link as LinkIcon,
  Save,
} from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const getProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
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

    getProfile();
  }, [user, navigate, toast, t]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
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

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <span className="text-lg">{t("loading")}</span>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t("basicInfo")}
              </CardTitle>
              <CardDescription>{t("basicInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("fullName")}</label>
                  <Input
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    placeholder={t("fullNamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("title")}</label>
                  <Input
                    value={profile.title}
                    onChange={(e) =>
                      setProfile({ ...profile, title: e.target.value })
                    }
                    placeholder={t("titlePlaceholder")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("bio")}</label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  placeholder={t("bioPlaceholder")}
                  className="h-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                {t("contactInfo")}
              </CardTitle>
              <CardDescription>{t("contactInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {t("location")}
                  </label>
                  <Input
                    value={profile.location}
                    onChange={(e) =>
                      setProfile({ ...profile, location: e.target.value })
                    }
                    placeholder={t("locationPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {t("phoneNumber")}
                  </label>
                  <Input
                    value={profile.phone_number}
                    onChange={(e) =>
                      setProfile({ ...profile, phone_number: e.target.value })
                    }
                    placeholder={t("phoneNumberPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {t("email")}
                  </label>
                  <Input value={user?.email} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    {t("website")}
                  </label>
                  <Input
                    value={profile.website}
                    onChange={(e) =>
                      setProfile({ ...profile, website: e.target.value })
                    }
                    placeholder={t("websitePlaceholder")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                {t("educationInfo")}
              </CardTitle>
              <CardDescription>{t("educationInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("university")}</label>
                  <Input
                    value={profile.university}
                    onChange={(e) =>
                      setProfile({ ...profile, university: e.target.value })
                    }
                    placeholder={t("universityPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("fieldOfStudy")}
                  </label>
                  <Input
                    value={profile.field_of_study}
                    onChange={(e) =>
                      setProfile({ ...profile, field_of_study: e.target.value })
                    }
                    placeholder={t("fieldOfStudyPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("graduationYear")}
                  </label>
                  <Input
                    type="number"
                    value={profile.graduation_year}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        graduation_year: e.target.value,
                      })
                    }
                    placeholder={t("graduationYearPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("studentStatus")}
                  </label>
                  <Input
                    value={profile.student_status}
                    onChange={(e) =>
                      setProfile({ ...profile, student_status: e.target.value })
                    }
                    placeholder={t("studentStatusPlaceholder")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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
  );
};

export default Profile;


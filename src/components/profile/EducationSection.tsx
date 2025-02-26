
import { GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EducationSectionProps {
  profile: {
    university: string;
    field_of_study: string;
    graduation_year: string;
    student_status: string;
  };
  setProfile: (profile: any) => void;
}

export const EducationSection = ({ profile, setProfile }: EducationSectionProps) => {
  const { t } = useLanguage();

  return (
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
            <label className="text-sm font-medium">{t("fieldOfStudy")}</label>
            <Input
              value={profile.field_of_study}
              onChange={(e) =>
                setProfile({ ...profile, field_of_study: e.target.value })
              }
              placeholder={t("fieldOfStudyPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("graduationYear")}</label>
            <Input
              type="number"
              value={profile.graduation_year}
              onChange={(e) =>
                setProfile({ ...profile, graduation_year: e.target.value })
              }
              placeholder={t("graduationYearPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("studentStatus")}</label>
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
  );
};


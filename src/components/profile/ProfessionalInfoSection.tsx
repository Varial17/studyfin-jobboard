
import { Briefcase, FileText, Github, Linkedin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProfessionalInfoSectionProps {
  profile: {
    cv_url: string;
    github_url: string;
    linkedin_url: string;
  };
  setProfile: (profile: any) => void;
  uploading: boolean;
  handleCVUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfessionalInfoSection = ({
  profile,
  setProfile,
  uploading,
  handleCVUpload,
}: ProfessionalInfoSectionProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className={isMobile ? "p-4" : "p-6"}>
        <CardTitle className="flex items-center gap-2 text-lg md:text-2xl">
          <Briefcase className="w-5 h-5" />
          {t("professionalInfo")}
        </CardTitle>
        <CardDescription>{t("professionalInfoDesc")}</CardDescription>
      </CardHeader>
      <CardContent className={`space-y-4 ${isMobile ? "p-4 pt-0" : "p-6 pt-0"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t("cv")}
            </label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCVUpload}
              disabled={uploading}
              className="text-sm"
            />
            {profile.cv_url && (
              <a
                href={profile.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {t("viewCV")}
              </a>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </label>
            <Input
              value={profile.github_url}
              onChange={(e) =>
                setProfile({ ...profile, github_url: e.target.value })
              }
              placeholder="https://github.com/username"
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="text-sm font-medium flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </label>
            <Input
              value={profile.linkedin_url}
              onChange={(e) =>
                setProfile({ ...profile, linkedin_url: e.target.value })
              }
              placeholder="https://linkedin.com/in/username"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

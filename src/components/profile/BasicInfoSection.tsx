
import { User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BasicInfoSectionProps {
  profile: {
    full_name: string;
    title: string;
    bio: string;
  };
  setProfile: (profile: any) => void;
}

export const BasicInfoSection = ({ profile, setProfile }: BasicInfoSectionProps) => {
  const { t } = useLanguage();

  return (
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
  );
};


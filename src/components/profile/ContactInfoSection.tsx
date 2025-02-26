
import { MapPin, Phone, Mail, Link as LinkIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ContactInfoSectionProps {
  profile: {
    location: string;
    phone_number: string;
    website: string;
  };
  setProfile: (profile: any) => void;
  userEmail?: string;
}

export const ContactInfoSection = ({ profile, setProfile, userEmail }: ContactInfoSectionProps) => {
  const { t } = useLanguage();

  return (
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
            <Input value={userEmail} disabled />
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
  );
};


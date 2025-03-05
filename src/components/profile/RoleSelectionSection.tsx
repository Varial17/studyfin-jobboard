
import { User, Briefcase } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RoleSelectionSectionProps {
  profile: {
    role?: string;
  };
  setProfile: (profile: any) => void;
}

export const RoleSelectionSection = ({ profile, setProfile }: RoleSelectionSectionProps) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          {t("roleSelection")}
        </CardTitle>
        <CardDescription>{t("roleSelectionDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup 
          value={profile.role || 'applicant'} 
          onValueChange={(value) => setProfile({ ...profile, role: value })}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
            <RadioGroupItem value="applicant" id="applicant" />
            <Label htmlFor="applicant" className="flex items-center cursor-pointer">
              <User className="h-5 w-5 mr-2" />
              <div>
                <div className="font-medium">{t("applicantRole")}</div>
                <div className="text-sm text-muted-foreground">{t("applicantRoleDesc")}</div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
            <RadioGroupItem value="employer" id="employer" />
            <Label htmlFor="employer" className="flex items-center cursor-pointer">
              <Briefcase className="h-5 w-5 mr-2" />
              <div>
                <div className="font-medium">{t("employerRole")}</div>
                <div className="text-sm text-muted-foreground">{t("employerRoleDesc")}</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};


import { User, Briefcase, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { StripeService } from "@/services/StripeService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface RoleSelectionSectionProps {
  profile: {
    role?: string;
    subscription_status?: string;
  };
  setProfile: (profile: any) => void;
}

export const RoleSelectionSection = ({ profile, setProfile }: RoleSelectionSectionProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRoleChange = (value: string) => {
    // If they're switching to employer and don't have an active subscription
    if (value === 'employer' && profile.subscription_status !== 'active') {
      setDialogOpen(true);
    } else {
      setProfile({ ...profile, role: value });
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await StripeService.createCheckoutSession(user.id);
      
      if ('error' in result) {
        toast({
          variant: "destructive",
          title: t("error"),
          description: result.error,
        });
      } else {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("error"),
        description: error.message || "Failed to initiate subscription",
      });
    } finally {
      setIsLoading(false);
      setDialogOpen(false);
    }
  };

  const hasActiveSubscription = profile.subscription_status === 'active';

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
          onValueChange={handleRoleChange}
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
            <RadioGroupItem 
              value="employer" 
              id="employer" 
              disabled={!hasActiveSubscription && profile.role !== 'employer'}
            />
            <Label htmlFor="employer" className="flex items-center cursor-pointer">
              <Briefcase className="h-5 w-5 mr-2" />
              <div className="flex-1">
                <div className="font-medium">{t("employerRole")}</div>
                <div className="text-sm text-muted-foreground">{t("employerRoleDesc")}</div>
              </div>
              {!hasActiveSubscription && (
                <span className="text-sm text-blue-600 font-medium ml-2">
                  $50/month
                </span>
              )}
            </Label>
          </div>
        </RadioGroup>

        {hasActiveSubscription && profile.role === 'employer' && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
            You have an active employer subscription.
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe to Employer Account</DialogTitle>
            <DialogDescription className="pt-4">
              To access employer features and post jobs, you need to subscribe to our employer plan for $50 per month.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div className="font-medium">Employer Subscription - $50/month</div>
              <ul className="text-sm space-y-1">
                <li>• Post unlimited job listings</li>
                <li>• Access to applicant profiles</li>
                <li>• Manage job applications</li>
                <li>• Premium support</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubscribe} disabled={isLoading}>
                {isLoading ? "Processing..." : "Subscribe Now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

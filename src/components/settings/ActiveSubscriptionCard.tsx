
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CreditCard, Save } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";

interface ActiveSubscriptionCardProps {
  onSave: () => void;
  saving: boolean;
}

export function ActiveSubscriptionCard({ onSave, saving }: ActiveSubscriptionCardProps) {
  const { t } = useLanguage();
  const { manageSubscriptionLoading, handleManageSubscription } = useSubscription();

  return (
    <Card>
      <CardContent className="pt-6 mt-2">
        <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>You have an active employer subscription</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManageSubscription}
            disabled={manageSubscriptionLoading}
            className="ml-auto"
          >
            {manageSubscriptionLoading ? "Loading..." : "Manage Subscription"}
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? t("saving") : t("saveSettings")}
        </Button>
      </CardFooter>
    </Card>
  );
}

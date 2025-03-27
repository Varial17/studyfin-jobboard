
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { PricingSectionDemo } from "@/components/ui/pricing-section-demo";

interface AccountTypeSelectorProps {
  onSave: () => void;
  saving: boolean;
  onAction: (action: "selectFree" | "checkout", tier: any) => void;
  disableSave: boolean;
}

export function AccountTypeSelector({ onSave, saving, onAction, disableSave }: AccountTypeSelectorProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose Your Account Type</h2>
      <p className="text-muted-foreground mb-6">
        Select the account type that best suits your needs
      </p>
      
      <PricingSectionDemo onAction={onAction} />
      
      <Card className="mt-8">
        <CardFooter className="justify-end pt-6">
          <Button
            onClick={onSave}
            disabled={saving || disableSave}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save as Job Seeker"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

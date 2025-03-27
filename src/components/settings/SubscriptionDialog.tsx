
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { EmbeddedStripeCheckout } from "@/components/ui/embedded-stripe-checkout";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SubscriptionDialog({ open, onOpenChange, onSuccess }: SubscriptionDialogProps) {
  const { user } = useAuth();
  const { error, checkoutLoading, handleCheckout, setError } = useSubscription();
  const [showEmbeddedCheckout, setShowEmbeddedCheckout] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  // Check for success URL param on component mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const successParam = url.searchParams.get('success');
    
    if (successParam === 'true') {
      setSubscriptionSuccess(true);
      handleSubscriptionSuccess();
      // Remove query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubscriptionSuccess = async () => {
    setSubscriptionSuccess(true);
    onSuccess();
  };

  const closeDialog = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Employer Subscription</DialogTitle>
          <DialogDescription>
            Subscribe to access employer features, including posting unlimited job listings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {showEmbeddedCheckout ? (
            subscriptionSuccess ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <AlertDescription className="text-green-700">
                  Payment successful! Your subscription is now active.
                </AlertDescription>
              </Alert>
            ) : (
              <EmbeddedStripeCheckout 
                userId={user?.id || ''} 
                onSuccess={handleSubscriptionSuccess} 
              />
            )
          ) : (
            <div className="rounded-lg border p-4">
              <div className="font-medium">Employer Subscription</div>
              <div className="text-2xl font-bold mt-2">$50/month</div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Post unlimited job listings
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Access to all applicant profiles
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Premium analytics dashboard
                </li>
              </ul>
            </div>
          )}
        </div>
        
        {error && !showEmbeddedCheckout && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          {!showEmbeddedCheckout && (
            <Button 
              onClick={() => setShowEmbeddedCheckout(true)} 
              disabled={checkoutLoading}
            >
              {checkoutLoading ? "Processing..." : "Continue to Payment"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

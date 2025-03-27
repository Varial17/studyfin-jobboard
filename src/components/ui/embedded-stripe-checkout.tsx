
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/integrations/supabase/client"

interface EmbeddedStripeCheckoutProps {
  onSuccess: () => void;
  userId: string;
}

export function EmbeddedStripeCheckout({ onSuccess, userId }: EmbeddedStripeCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check for success on page load (for redirect back from Stripe)
  useState(() => {
    const checkSuccess = () => {
      const url = new URL(window.location.href);
      const successParam = url.searchParams.get('success');
      
      if (successParam === 'true') {
        setSuccess(true);
        onSuccess();
        // Remove query params from URL to prevent refresh issues
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    checkSuccess();
  });

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the user's email from auth
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email;
      
      if (!userEmail) {
        throw new Error("User email not found. Please ensure you're logged in.");
      }
      
      console.log("Creating Stripe checkout session for user:", userId);
      
      // Direct payment link for the subscription - replace with your actual payment link
      const paymentLink = "https://buy.stripe.com/test_5kAdU3bCeblJcqQ3cc";
      
      // Redirect directly to the payment link
      window.location.href = paymentLink;
      
    } catch (err) {
      console.error("Error redirecting to checkout:", err);
      setError(err.message || "An unexpected error occurred. Please try again later.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <AlertDescription className="text-green-700">
          Payment successful! Your subscription is now active.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Card className="p-6">
          <div className="flex flex-col space-y-4 items-center">
            <h3 className="text-lg font-medium">Employer Subscription - $50/month</h3>
            <p className="text-center text-sm text-muted-foreground">
              Subscribe to access employer features, including unlimited job postings and applicant tracking
            </p>
            
            <Button 
              className="w-full"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Processing...
                </>
              ) : (
                "Try Again"
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col space-y-4 items-center">
        <h3 className="text-lg font-medium">Employer Subscription - $50/month</h3>
        <p className="text-center text-sm text-muted-foreground">
          Subscribe to access employer features, including unlimited job postings and applicant tracking
        </p>
        
        <Button 
          className="w-full"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Processing...
            </>
          ) : (
            "Subscribe Now"
          )}
        </Button>
      </div>
    </Card>
  );
}

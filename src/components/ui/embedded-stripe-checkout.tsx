
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { StripeElementsOptions } from "@stripe/stripe-js"
import { createPaymentIntent } from "@/services/payment"
import { supabase } from "@/integrations/supabase/client"

// Initialize Stripe with your publishable key
// This key is safe to be in the client code
const stripePromise = loadStripe("pk_live_51QyNBYA1u9Lm91TyZDDQqYKQJ0zLHyxnY6JW2Qeez8TAGMnyoQQJFGxgUTkEq5dhCqDFBIbmXncvv4EkQVCW7xo200PfBTQ9Wz");

const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/settings",
      },
      redirect: "if_required",
    });

    if (error) {
      console.error("Payment error:", error);
      setErrorMessage(error.message || "An error occurred with your payment");
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      console.log("Payment succeeded:", paymentIntent);
      setSucceeded(true);
      setProcessing(false);
      onSuccess();
    } else {
      console.log("Payment status:", paymentIntent?.status);
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <AlertDescription className="text-green-700">
          Payment successful! Your subscription is now active.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || processing} 
        className="w-full"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Processing...
          </>
        ) : (
          "Subscribe Now"
        )}
      </Button>
    </form>
  );
};

interface EmbeddedStripeCheckoutProps {
  onSuccess: () => void;
  userId: string;
}

export function EmbeddedStripeCheckout({ onSuccess, userId }: EmbeddedStripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);

  // Debug state to track the flow
  const [debugState, setDebugState] = useState<string>("initializing");

  useEffect(() => {
    console.log(`Stripe checkout state: ${debugState}`);
    
    const getPaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);
        setDebugState("fetching payment intent");

        console.log(`Fetching payment intent for user: ${userId}`);
        const data = await createPaymentIntent(userId);
        console.log("Payment intent created:", data);
        
        if (!data || !data.clientSecret) {
          throw new Error("Failed to create payment intent - no client secret returned");
        }
        
        setClientSecret(data.clientSecret);
        setDebugState("payment intent received");
      } catch (err) {
        console.error("Error creating payment intent:", err);
        setError("We're experiencing issues with our payment system. Please try the alternative checkout method below.");
        setFallbackMode(true);
        setDebugState("error-fallback");
      } finally {
        setLoading(false);
      }
    };

    getPaymentIntent();
  }, [userId, debugState]);

  const handleFallbackCheckout = async () => {
    setFallbackLoading(true);
    setDebugState("fallback-checkout-initiated");
    try {
      // Make a direct call to stripe-subscription edge function
      const { data, error } = await supabase.functions.invoke('stripe-subscription', {
        body: {
          user_id: userId,
          return_url: `${window.location.origin}/settings`
        }
      });
      
      if (error) throw new Error(error.message || 'Failed to start checkout');
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(`Checkout failed: ${err.message || 'Unknown error'}`);
      setDebugState("fallback-checkout-failed");
    } finally {
      setFallbackLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Initializing payment...</span>
      </Card>
    );
  }

  if (fallbackMode || error) {
    return (
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card className="p-6">
          <div className="flex flex-col space-y-4 items-center">
            <h3 className="text-lg font-medium">Employer Subscription - $50/month</h3>
            <p className="text-center text-sm text-muted-foreground">
              Subscribe to access employer features, including unlimited job postings and applicant tracking
            </p>
            <Button 
              className="w-full py-6 text-lg"
              onClick={handleFallbackCheckout}
              disabled={fallbackLoading}
            >
              {fallbackLoading ? (
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
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to initialize payment. Please try again.</AlertDescription>
      </Alert>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0284c7',
      },
    },
  };

  console.log("Rendering Stripe Elements with options:", { 
    clientSecretProvided: !!clientSecret,
    stripeLoaded: !!stripePromise
  });

  return (
    <Card className="p-6">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm onSuccess={onSuccess} />
      </Elements>
    </Card>
  );
}

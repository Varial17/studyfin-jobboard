
"use client"

import { useEffect, useState, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js"
import { supabase } from "@/integrations/supabase/client"

// Initialize Stripe - using your publishable key
const stripePromise = loadStripe("pk_live_51QyNBYA1u9Lm91TyZDDQqYKQJ0zLHyxnY6JW2Qeez8TAGMnyoQQJFGxgUTkEq5dhCqDFBIbmXncvv4EkQVCW7xo200PfBTQ9Wz");

// CheckoutForm component that handles the payment submission
const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    console.log("Processing payment...");
    
    try {
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        console.error("Elements submission error:", submitError);
        setErrorMessage(submitError.message);
        setProcessing(false);
        return;
      }
      
      // Confirm the payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings?success=true`,
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error("Payment error:", error);
        setErrorMessage(error.message || "An unexpected error occurred");
      } else {
        console.log("Payment succeeded!");
        setSucceeded(true);
        onSuccess();
      }
    } catch (err) {
      console.error("Exception during payment confirmation:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
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
      <PaymentElement options={{layout: 'accordion'}} />
      
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        type="submit" 
        disabled={processing || !stripe || !elements} 
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

// Email input component
const EmailInput = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setEmail(e.target.value);
  };

  return (
    <div className="mb-4">
      <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={handleChange}
        className="w-full px-3 py-2 border rounded-md"
        placeholder="your.email@example.com"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

interface EmbeddedStripeCheckoutProps {
  onSuccess: () => void;
  userId: string;
}

export function EmbeddedStripeCheckout({ onSuccess, userId }: EmbeddedStripeCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Function to fetch client secret from our backend
  const fetchClientSecret = async () => {
    try {
      console.log("Fetching payment intent for user:", userId);
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { user_id: userId }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to create payment intent');
      }
      
      if (!data || !data.clientSecret) {
        throw new Error('Invalid response - no client secret returned');
      }
      
      console.log("Payment intent created successfully");
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError(error.message || "Failed to initialize payment");
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientSecret();
  }, [userId]);

  const handleFallbackCheckout = async () => {
    setFallbackLoading(true);
    try {
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
    } finally {
      setFallbackLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setFallbackMode(false);
    fetchClientSecret();
  };

  if (loading) {
    return (
      <Card className="p-6 flex flex-col justify-center items-center space-y-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-center">Initializing payment...</span>
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
            
            <div className="w-full space-y-3">
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
              
              {error && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleRetry}
                >
                  Retry Embedded Checkout
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to initialize payment. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-6">
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <div className="space-y-4">
          <EmailInput />
          <CheckoutForm onSuccess={onSuccess} />
        </div>
      </Elements>
    </Card>
  );
}

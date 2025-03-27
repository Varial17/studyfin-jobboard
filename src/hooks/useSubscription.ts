
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useSubscription() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [manageSubscriptionLoading, setManageSubscriptionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!user) return;
    
    setCheckoutLoading(true);
    setError(null);
    setDebugInfo(null);
    
    try {
      console.log("Calling Stripe subscription endpoint...");
      
      const response = await supabase.functions.invoke('stripe-subscription', {
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          return_url: `${window.location.origin}/settings`
        })
      });
      
      console.log("Response from Stripe:", response);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }
      
      if (!response.data?.url) {
        throw new Error("Invalid response from server. Missing checkout URL.");
      }
      
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      
      let errorMessage = error.message || "Unknown error";
      let details = error.details || null;
      
      setError(errorMessage);
      
      if (details) {
        setDebugInfo(details);
      }
      
      setCheckoutLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start checkout process. Please see the error details above."
      });
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setManageSubscriptionLoading(true);
    setError(null);
    try {
      const response = await supabase.functions.invoke('stripe-subscription/customer-portal', {
        body: JSON.stringify({
          user_id: user.email,
          return_url: `${window.location.origin}/settings`
        })
      });

      if (response.error) {
        throw new Error(response.error.message || response.error || "Failed to access subscription management");
      }
      
      if (!response.data?.url) {
        throw new Error("Invalid response from server. Missing portal URL.");
      }
      
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Manage subscription error:", error);
      setError(`Failed to access subscription management: ${error.message || "Unknown error"}`);
      setManageSubscriptionLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to access subscription management. Please try again or contact support."
      });
    }
  };

  const updateProfileAfterSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          role: "employer", 
          subscription_status: "active"
        })
        .eq("id", user.id);
      
      if (updateError) throw updateError;

      await refreshUser();
      
      toast({
        title: "Success",
        description: "Your employer subscription is now active. You can post unlimited job listings.",
      });
      
      return true;
    } catch (error) {
      console.error("Error updating profile after subscription:", error);
      setError("Failed to update profile information. Please refresh the page.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    checkoutLoading,
    manageSubscriptionLoading,
    error,
    debugInfo,
    handleCheckout,
    handleManageSubscription,
    updateProfileAfterSubscription,
    setError,
    setDebugInfo
  };
}


import { supabase, checkSupabaseConnection, handleSupabaseError } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const StripeService = {
  async createCheckoutSession(userId: string): Promise<{ url: string } | { error: string }> {
    try {
      console.log("Creating checkout session for user:", userId);
      
      // First check if we have a valid connection
      const connected = await checkSupabaseConnection();
      if (!connected) {
        console.error("Cannot create checkout session: No connection to Supabase");
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Cannot connect to the payment service. Please check your internet connection and try again.",
        });
        return { error: "Cannot connect to the payment service. Please check your internet connection and try again." };
      }
      
      // Then check if we have a valid session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        const errorDetails = handleSupabaseError(sessionError, 'auth.getSession');
        
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: errorDetails.message,
        });
        
        return { error: "Authentication error: " + errorDetails.message };
      }
      
      if (!sessionData.session) {
        console.error("No active session found");
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "You must be logged in to create a checkout session",
        });
        return { error: "You must be logged in to create a checkout session" };
      }
      
      // Validate connection before calling function
      try {
        console.log("Invoking Supabase function: create-checkout-session");
        const { data, error } = await supabase.functions.invoke("create-checkout-session", {
          body: {
            user_id: userId,
            return_url: `${window.location.origin}/profile/settings`,
          },
        });

        if (error) {
          console.error("Error creating checkout session:", error);
          const errorDetails = handleSupabaseError(error, 'functions.create-checkout-session');
          
          toast({
            variant: "destructive",
            title: "Payment Service Error",
            description: errorDetails.message,
          });
          
          return { error: errorDetails.message || "Failed to create checkout session" };
        }

        if (!data || !data.url) {
          console.error("Invalid response from create-checkout-session function:", data);
          return { error: "Failed to create checkout session: No URL returned" };
        }

        console.log("Checkout session created successfully, redirecting to:", data.url);
        return { url: data.url };
      } catch (functionError: any) {
        console.error("Function invocation error:", functionError);
        const errorDetails = handleSupabaseError(functionError, 'function invocation');
        
        toast({
          variant: "destructive",
          title: "Service Error",
          description: errorDetails.message,
        });
        
        return { error: "Error connecting to payment service: " + (functionError.message || "Unknown error") };
      }
    } catch (error: any) {
      console.error("Exception in createCheckoutSession:", error);
      return { error: error.message || "An unknown error occurred" };
    }
  },
};

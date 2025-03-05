
import { supabase } from "@/integrations/supabase/client";

export const StripeService = {
  async createCheckoutSession(userId: string): Promise<{ url: string } | { error: string }> {
    try {
      console.log("Creating checkout session for user:", userId);
      
      // First check if we have a valid session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        return { error: "Authentication error: " + sessionError.message };
      }
      
      if (!sessionData.session) {
        console.error("No active session found");
        return { error: "You must be logged in to create a checkout session" };
      }
      
      console.log("Invoking Supabase function: create-checkout-session");
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          user_id: userId,
          return_url: `${window.location.origin}/profile/settings`,
        },
      });

      if (error) {
        console.error("Error creating checkout session:", error);
        return { error: error.message || "Failed to create checkout session" };
      }

      if (!data || !data.url) {
        console.error("Invalid response from create-checkout-session function:", data);
        return { error: "Failed to create checkout session: No URL returned" };
      }

      console.log("Checkout session created successfully, redirecting to:", data.url);
      return { url: data.url };
    } catch (error: any) {
      console.error("Exception in createCheckoutSession:", error);
      return { error: error.message || "An unknown error occurred" };
    }
  },
};

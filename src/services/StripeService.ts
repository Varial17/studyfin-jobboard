
import { supabase } from "@/integrations/supabase/client";

export const StripeService = {
  async createCheckoutSession(userId: string): Promise<{ url: string } | { error: string }> {
    try {
      console.log("Creating checkout session for user:", userId);
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          user_id: userId,
          return_url: `${window.location.origin}/profile/settings`,
        },
      });

      if (error) {
        console.error("Error creating checkout session:", error);
        return { error: error.message };
      }

      if (!data || !data.url) {
        console.error("Invalid response from create-checkout-session function:", data);
        return { error: "Failed to create checkout session" };
      }

      console.log("Checkout session created successfully");
      return { url: data.url };
    } catch (error: any) {
      console.error("Error in createCheckoutSession:", error);
      return { error: error.message || "An unknown error occurred" };
    }
  },
};

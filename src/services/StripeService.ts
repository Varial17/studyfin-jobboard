
import { supabase } from "@/integrations/supabase/client";

export const StripeService = {
  async createCheckoutSession(userId: string): Promise<{ url: string } | { error: string }> {
    try {
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

      return { url: data.url };
    } catch (error) {
      console.error("Error in createCheckoutSession:", error);
      return { error: error.message };
    }
  },
};

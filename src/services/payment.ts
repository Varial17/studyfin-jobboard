
import { supabase } from '@/integrations/supabase/client';

export async function createPaymentIntent(userId: string) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { user_id: userId }
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Payment service error:', error);
    throw error;
  }
}

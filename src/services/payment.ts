
import { supabase } from '@/integrations/supabase/client';

export async function createPaymentIntent(userId: string) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    console.log(`Creating payment intent for user ${userId}`);
    
    // Generate a unique idempotency key for this request
    const idempotencyKey = crypto.randomUUID();
    
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { 
        user_id: userId,
        idempotency_key: idempotencyKey
      }
    });
    
    if (error) {
      console.error('Payment service error:', error);
      throw error;
    }
    
    if (!data || !data.clientSecret) {
      console.error('Invalid response from create-payment-intent:', data);
      throw new Error('Invalid response from payment service');
    }
    
    console.log('Payment intent created successfully');
    return data;
  } catch (error) {
    console.error('Payment service error:', error);
    throw error;
  }
}

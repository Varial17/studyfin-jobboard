
import { supabase } from '@/integrations/supabase/client';

export async function createPaymentIntent(userId: string, retryCount = 0) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    console.log(`Creating payment intent for user ${userId} (attempt ${retryCount + 1})`);
    
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { user_id: userId }
    });
    
    if (error) {
      console.error('Payment service error:', error);
      
      // Check if it's a temporary error and retry if needed
      if (error.message && 
          (error.message.includes('lock_timeout') || 
           error.message.includes('rate limit') || 
           error.message.includes('429') ||
           error.message.includes('timeout')) && 
          retryCount < 3) {
        
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying payment intent creation in ${delay}ms...`);
        
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(createPaymentIntent(userId, retryCount + 1));
          }, delay);
        });
      }
      
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


-- Add subscription fields to profiles table
ALTER TABLE profiles
ADD COLUMN subscription_id TEXT,
ADD COLUMN subscription_status TEXT;

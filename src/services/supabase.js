import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ydetmjryjpnrpcmoxvre.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uLl0hF0mVvqWHBHUZSMFEA_g-YtL6a9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: false,
    persistSession:     true,
    autoRefreshToken:   true,
    storageKey:         'read-auth-v1',
  },
});

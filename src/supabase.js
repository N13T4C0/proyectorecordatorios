import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ytxtzfevehyhpwjwvgrx.supabase.co";
const supabasePublishableKey = "sb_publishable_IPZTLGlCbBLU9cf7b28FOw_3d1CuBDa";

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
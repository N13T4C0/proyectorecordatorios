import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ytxtzfevehyhpwjwvgrx.supabase.co";
const supabasePublishableKey = import.meta.env.VITE_SUPABASEKEY;

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
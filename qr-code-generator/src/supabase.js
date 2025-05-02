import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SBURL
const supabaseKey = process.env.NEXT_PUBLIC_SBKEY

export const supabase = createClient(supabaseUrl, supabaseKey)
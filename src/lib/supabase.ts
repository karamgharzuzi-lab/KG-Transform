import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pfkiqdrwqotjdbgijvxk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBma2lxZHJ3cW90amRiZ2lqdnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTcyMzcsImV4cCI6MjA5MDI5MzIzN30.yDEquBcai-etP-BjExyrncOOAXzeK_7sZVu-QxpOu6A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ajocakqhywxnzzusyydv.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqb2Nha3FoeXd4bnp6dXN5eWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjA5NzIsImV4cCI6MjA4ODAzNjk3Mn0.jMwmg89KqarlMBSzU8l1buhLZ__kwMIZQRzUiBllOBs';

export const supabase = createClient(supabaseUrl, supabaseKey);

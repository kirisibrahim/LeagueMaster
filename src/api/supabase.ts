import { createClient } from '@supabase/supabase-js';

// .env dosyasındaki değişkenleri okuyoruz
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Supabase istemcisini oluşturuyoruz
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
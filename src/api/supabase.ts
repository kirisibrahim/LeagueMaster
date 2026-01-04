import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // oturumu telefonun hafızasına kaydet
    autoRefreshToken: true, // token eskidiğinde otomatik yenile
    persistSession: true,   // uygulama kapansa da oturumu hatırla
    detectSessionInUrl: false,
  },
});
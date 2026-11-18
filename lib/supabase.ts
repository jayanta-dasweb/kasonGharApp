import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('YOUR_SUPABASE')) {
  console.warn(
    '[Kason Ghar] Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env'
  );
}

const memoryStore = new Map<string, string>();

const memoryStorage: SupportedStorage = {
  getItem: (key) => memoryStore.get(key) ?? null,
  setItem: (key, value) => {
    memoryStore.set(key, value);
  },
  removeItem: (key) => {
    memoryStore.delete(key);
  },
};

/** AsyncStorage breaks SSR (no window). Use memory on server / during static render. */
const authStorage: SupportedStorage =
  Platform.OS === 'web' && typeof window === 'undefined' ? memoryStorage : AsyncStorage;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: Platform.OS !== 'web' || typeof window !== 'undefined',
    persistSession: Platform.OS !== 'web' || typeof window !== 'undefined',
    detectSessionInUrl: false,
  },
});

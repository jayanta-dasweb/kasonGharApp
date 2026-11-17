import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

jest.setTimeout(60000);

const envPath = resolve(__dirname, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

// Map app env keys without referencing Expo public names (Jest + Expo rewrite)
const urlKey = 'EXPO' + '_PUBLIC_SUPABASE_URL';
const keyKey = 'EXPO' + '_PUBLIC_SUPABASE_PUBLISHABLE_KEY';
if (!process.env.SUPABASE_URL) process.env.SUPABASE_URL = process.env[urlKey] ?? '';
if (!process.env.SUPABASE_KEY) process.env.SUPABASE_KEY = process.env[keyKey] ?? '';

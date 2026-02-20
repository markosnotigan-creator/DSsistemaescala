import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function testConnection() {
  console.log('--- Supabase Connection Test ---');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.');
    return;
  }

  console.log(`URL: ${supabaseUrl}`);
  console.log(`Key: ${supabaseAnonKey.substring(0, 5)}...`);

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from('app_settings').select('*').limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Connection successful!');
      console.log('Data retrieved:', data);
    }
  } catch (err: any) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();

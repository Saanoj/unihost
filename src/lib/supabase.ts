import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a Supabase client with enhanced real-time configuration
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  realtime: {
    params: {
      eventsPerSecond: 5, // Decreased to reduce load on the connection
      heartbeatIntervalMs: 30000, // Increased to 30 seconds for more stable connections
      timeout: 60000 // Increased to 60 seconds to better handle poor connections
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'unihost-messaging@0.1.0'
    }
  },
  db: {
    schema: 'public'
  }
});

/**
 * Helper function to check connection status - returns true if connected
 * This function attempts multiple queries to verify the connection works
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Try a basic health query as primary check
    const { error: healthError } = await supabase.rpc('healthcheck', {});
    
    if (!healthError) {
      return true; // Successfully connected
    }
    
    // If the health check failed, try a basic table query
    const { error: queryError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (!queryError) {
      return true; // Successfully queried users
    }
    
    console.warn('Connection check failed');
    return false;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
};

/**
 * Helper to force refresh the client connection
 * This completely tears down all channels and verifies database connectivity
 */
export const refreshSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Starting Supabase connection refresh');
    
    // First remove all channels to clear any stuck connections
    await supabase.removeAllChannels();
    console.log('All channels removed');
    
    // Wait a bit for connections to fully close
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify connection is working
    const isConnected = await checkSupabaseConnection();
    
    if (isConnected) {
      console.log('Connection successfully refreshed');
      return true;
    }
    
    console.error('Failed to re-establish connection');
    return false;
  } catch (error) {
    console.error('Error refreshing Supabase connection:', error);
    return false;
  }
};

/**
 * Health check function that pings Supabase to keep the connection alive
 */
export const pingSupabaseConnection = async (): Promise<boolean> => {
  try {
    return await checkSupabaseConnection();
  } catch (error) {
    console.warn('Ping to Supabase failed:', error);
    return false;
  }
};
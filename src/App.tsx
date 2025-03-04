import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HostView from './pages/HostView';
import TravelerView from './pages/TravelerView';
import { useAppStore } from './store';
import LoadingScreen from './components/shared/LoadingScreen';
import ErrorAlert from './components/shared/ErrorAlert';
import { supabase, checkSupabaseConnection } from './lib/supabase';

// Mock user for development with proper UUID format
const MOCK_HOST_USER = {
  id: '00000000-0000-0000-0000-000000000001', // Valid UUID format
  username: 'host_user',
  email: 'host@example.com',
  created_at: new Date().toISOString(),
  is_host: true
};

function App() {
  const { setCurrentUser, isHost } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_CONNECTION_RETRIES = 3;

  // Create or update mock user and set as current user
  const setupMockUser = async () => {
    try {
      // First check if the mock user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', MOCK_HOST_USER.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking for mock user:', fetchError);
      }
      
      // If user doesn't exist, create it
      if (!existingUser) {
        console.log('Creating mock user...');
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([MOCK_HOST_USER])
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating mock user:', createError);
          return null;
        }
        
        return newUser;
      }
      
      return existingUser;
    } catch (error) {
      console.error('Error in setupMockUser:', error);
      return null;
    }
  };

  // Set mock user on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if Supabase connection is working
        const isConnected = await checkSupabaseConnection();
        
        if (!isConnected) {
          console.error('Error connecting to Supabase');
          // Check if we should retry
          if (retryCount < MAX_CONNECTION_RETRIES) {
            setRetryCount(prev => prev + 1);
            setError(`Connection attempt ${retryCount + 1}/${MAX_CONNECTION_RETRIES} failed. Retrying...`);
            
            // Retry with exponential backoff
            setTimeout(() => {
              setError(null);
              setLoading(true);
            }, 1000 * Math.pow(2, retryCount));
            
            return;
          }
          
          setError('Unable to connect to the database. Please check your connection and try again.');
          setLoading(false);
          return;
        }
        
        // Create or update mock user
        const user = await setupMockUser();
        
        if (user) {
          // Set mock user for development
          setCurrentUser(user);
          setRetryCount(0); // Reset retry count on success
          setLoading(false);
        } else {
          setError('Failed to set up mock user for development.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing app:', err);
        setError('An unexpected error occurred while initializing the application.');
        setLoading(false);
      }
    };

    if (loading) {
      initializeApp();
    }
  }, [setCurrentUser, loading, retryCount]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryCount(0);
  };

  if (loading) {
    return <LoadingScreen message="Initializing application..." />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={handleRetry} />;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isHost ? (
              <HostView />
            ) : (
              <TravelerView />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
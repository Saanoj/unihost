import React, { useState, useEffect, useCallback } from 'react';
import { checkSupabaseConnection, pingSupabaseConnection } from '../../lib/supabase';

type ConnectionStatusProps = {
  onReconnect: () => void;
};

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onReconnect }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isConnectionLost, setIsConnectionLost] = useState<boolean>(false);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [lastPingTime, setLastPingTime] = useState<number>(Date.now());
  
  // Function to ping Supabase to verify connection
  const pingSupabase = useCallback(async () => {
    if (isPinging || !navigator.onLine) return;
    
    setIsPinging(true);
    try {
      // Update last ping time
      setLastPingTime(Date.now());
      
      const isConnected = await pingSupabaseConnection();
      
      if (!isConnected) {
        console.warn('Supabase connection check failed');
        setIsConnectionLost(true);
      } else {
        setIsConnectionLost(false);
        setReconnectAttempts(0); // Reset attempts on successful connection
      }
    } catch (error) {
      console.error('Error pinging Supabase:', error);
      setIsConnectionLost(true);
    } finally {
      setIsPinging(false);
    }
  }, [isPinging]);
  
  // Handle reconnection attempt
  const handleReconnectClick = useCallback(async () => {
    if (isPinging) return;
    
    setReconnectAttempts((prev) => prev + 1);
    setIsPinging(true);
    
    try {
      await onReconnect();
      // Successful reconnection handled by the parent component
    } catch (error) {
      console.error('Error during reconnection:', error);
    } finally {
      setIsPinging(false);
    }
  }, [isPinging, onReconnect]);
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Check connection after a small delay to ensure network is stable
      setTimeout(() => pingSupabase(), 2000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsConnectionLost(true);
    };
    
    // Handle when page visibility changes (user comes back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastPing = Date.now() - lastPingTime;
        
        // If it's been more than 2 minutes since the last ping, check connection
        if (timeSinceLastPing > 120000 && navigator.onLine) {
          pingSupabase();
        }
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Periodic connection check
    const pingInterval = setInterval(() => {
      if (navigator.onLine) {
        pingSupabase();
      }
    }, 60000); // Check every minute
    
    // Initial ping after component mounts
    if (navigator.onLine) {
      pingSupabase();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(pingInterval);
    };
  }, [pingSupabase, lastPingTime]);
  
  // When offline or connection lost, show banner
  if (!isOnline || isConnectionLost) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-red-500 text-white p-2 flex justify-between items-center z-50">
        <div className="flex items-center">
          <svg 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <span>
            {!isOnline ? 
              'You are offline. Please check your internet connection.' : 
              'Connection to server lost. Real-time updates are not available.'}
          </span>
        </div>
        <button 
          onClick={handleReconnectClick}
          disabled={isPinging}
          className={`${isPinging ? 'bg-gray-300' : 'bg-white hover:bg-red-50'} text-red-500 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center`}
        >
          {isPinging ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            `Reconnect${reconnectAttempts > 0 ? ` (${reconnectAttempts})` : ''}`
          )}
        </button>
      </div>
    );
  }
  
  // When connection is good, don't show anything
  return null;
};

export default ConnectionStatus;
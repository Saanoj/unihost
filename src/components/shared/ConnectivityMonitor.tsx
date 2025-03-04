import React, { useEffect, useState, useCallback, useRef } from 'react';
import { checkSupabaseConnection, refreshSupabaseConnection } from '../../lib/supabase';

type ConnectivityMonitorProps = {
  onConnectionRestored: () => void;
};

/**
 * A hidden component that monitors connectivity to Supabase
 * and attempts to restore it when issues are detected.
 */
const ConnectivityMonitor: React.FC<ConnectivityMonitorProps> = ({ onConnectionRestored }) => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastConnectionTime, setLastConnectionTime] = useState(Date.now());
  const consecutiveFailuresRef = useRef(0);
  const MAX_CONSECUTIVE_FAILURES = 3;
  const MONITOR_INTERVAL = 2 * 60 * 1000; // 2 minutes
  
  // Record a successful connection
  const recordSuccessfulConnection = useCallback(() => {
    consecutiveFailuresRef.current = 0;
    setLastConnectionTime(Date.now());
  }, []);
  
  // Check and fix connection with retry logic
  const checkAndFixConnection = useCallback(async () => {
    if (!isMonitoring) return;
    
    console.log('ConnectivityMonitor: Checking connection status...');
    
    try {
      const isConnected = await checkSupabaseConnection();
      
      if (!isConnected) {
        console.warn(`ConnectivityMonitor: Connection check failed (failure #${consecutiveFailuresRef.current + 1})`);
        consecutiveFailuresRef.current++;
        
        // If we've exceeded the failure threshold, attempt to refresh
        if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
          console.warn('ConnectivityMonitor: Multiple connection failures detected, attempting to refresh connection');
          
          const restored = await refreshSupabaseConnection();
          
          if (restored) {
            console.log('ConnectivityMonitor: Connection successfully restored');
            consecutiveFailuresRef.current = 0;
            onConnectionRestored();
            recordSuccessfulConnection();
          } else {
            console.error('ConnectivityMonitor: Failed to restore connection');
            // We'll try again on the next interval
          }
        }
      } else {
        // Connection is good
        if (consecutiveFailuresRef.current > 0) {
          console.log('ConnectivityMonitor: Connection is healthy again');
          consecutiveFailuresRef.current = 0;
          onConnectionRestored();
        }
        recordSuccessfulConnection();
      }
    } catch (error) {
      console.error('ConnectivityMonitor: Error checking connection:', error);
      consecutiveFailuresRef.current++;
    }
  }, [isMonitoring, onConnectionRestored, recordSuccessfulConnection]);
  
  // Watch for connection issues on a regular interval
  useEffect(() => {
    // Check connection every 2 minutes
    const intervalId = setInterval(checkAndFixConnection, MONITOR_INTERVAL);
    
    // Also check when the component mounts
    checkAndFixConnection();
    
    return () => {
      clearInterval(intervalId);
      setIsMonitoring(false);
    };
  }, [checkAndFixConnection]);
  
  // Listen for network events to trigger checks
  useEffect(() => {
    const handleOnline = () => {
      console.log('ConnectivityMonitor: Network came online, verifying connection');
      // Wait a bit for the network to stabilize before checking
      setTimeout(checkAndFixConnection, 3000);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if it's been a while since our last connection check
        const timeSinceLastCheck = Date.now() - lastConnectionTime;
        if (timeSinceLastCheck > MONITOR_INTERVAL * 2) {
          console.log('ConnectivityMonitor: Tab visible after inactivity, checking connection');
          checkAndFixConnection();
        }
      }
    };
    
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAndFixConnection, lastConnectionTime, MONITOR_INTERVAL]);
  
  // This component doesn't render anything visible
  return null;
};

export default ConnectivityMonitor;
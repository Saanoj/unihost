import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import { ConversationWithDetails, Message, AiSuggestion } from '../types';
import { 
  getConversationsByUserId, 
  getMessagesByConversationId,
  getSuggestionsByConversationId 
} from '../services';

// Configuration constants
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds
const FETCH_TIMEOUT = 15000; // 15 seconds

export const useSupabaseSubscriptions = () => {
  // Get store functions
  const { 
    currentUser, 
    addConversation,
    updateConversation,
    addMessage, 
    addAiSuggestion,
    setError,
    setMessages,
    setAiSuggestions
  } = useAppStore();
  
  // State for tracking subscriptions and connection
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchTimeouts, setFetchTimeouts] = useState(false);
  
  // References for managing channels and timeouts
  const channelsRef = useRef(new Map());
  const timeoutsRef = useRef<Record<string, number>>({});
  const connectionCheckTimerRef = useRef<number | null>(null);
  
  // Clear a specific timer by key
  const clearTimer = useCallback((key: string) => {
    if (timeoutsRef.current[key]) {
      window.clearTimeout(timeoutsRef.current[key]);
      delete timeoutsRef.current[key];
    }
  }, []);
  
  // Clear all timers
  const clearAllTimers = useCallback(() => {
    Object.keys(timeoutsRef.current).forEach(key => {
      window.clearTimeout(timeoutsRef.current[key]);
    });
    timeoutsRef.current = {};
  }, []);
  
  // Timeout utility function
  const withTimeout = useCallback(<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T | null> => {
    return new Promise((resolve) => {
      const key = `${operationName}-${Date.now()}`;
      
      // Use window.setTimeout to avoid NodeJS.Timeout typing issues
      timeoutsRef.current[key] = window.setTimeout(() => {
        console.error(`${operationName} operation timed out after ${timeoutMs}ms`);
        setFetchTimeouts(true);
        delete timeoutsRef.current[key];
        resolve(null);
      }, timeoutMs);
      
      promise.then((result) => {
        clearTimer(key);
        resolve(result);
      }).catch((error) => {
        console.error(`Error in ${operationName}:`, error);
        clearTimer(key);
        resolve(null);
      });
    });
  }, [clearTimer]);
  
  // Data fetching functions
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return null;
    
    setLoading(true);
    
    try {
      const result = await withTimeout(
        getConversationsByUserId(currentUser.id),
        FETCH_TIMEOUT,
        'Fetch conversations'
      );
      
      return result;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser, withTimeout, setError]);
  
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    
    try {
      const result = await withTimeout(
        getMessagesByConversationId(conversationId),
        FETCH_TIMEOUT,
        'Fetch messages'
      );
      
      if (result) {
        setMessages(conversationId, result || []);
      }
      
      return result;
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      setError('Failed to load messages');
      return null;
    } finally {
      setLoading(false);
    }
  }, [withTimeout, setMessages, setError]);
  
  const fetchAiSuggestions = useCallback(async (conversationId: string) => {
    setLoading(true);
    
    try {
      const result = await withTimeout(
        getSuggestionsByConversationId(conversationId),
        FETCH_TIMEOUT,
        'Fetch AI suggestions'
      );
      
      if (result) {
        setAiSuggestions(conversationId, result || []);
      }
      
      return result;
    } catch (error) {
      console.error(`Error fetching AI suggestions for conversation ${conversationId}:`, error);
      setError('Failed to load AI suggestions');
      return null;
    } finally {
      setLoading(false);
    }
  }, [withTimeout, setAiSuggestions, setError]);
  
  // Handle real-time subscription events
  const handleConversationChange = useCallback((payload: any) => {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      if (eventType === 'INSERT') {
        console.log('New conversation:', newRecord);
        // Fetch the complete conversation with related data
        supabase
          .from('conversations')
          .select(`
            *,
            property:property_id(*),
            guest:guest_id(*),
            last_message:messages(*)
          `)
          .eq('id', newRecord.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching new conversation details:', error);
            } else if (data) {
              console.log('Adding conversation to store:', data);
              addConversation(data as ConversationWithDetails);
            }
          });
      } else if (eventType === 'UPDATE') {
        console.log('Updated conversation:', newRecord);
        // Similar fetch and update logic as INSERT
        if (newRecord && typeof updateConversation === 'function') {
          updateConversation(newRecord);
        }
      }
    } catch (error) {
      console.error('Error handling conversation change:', error);
    }
  }, [addConversation, updateConversation]);
  
  const handleMessageChange = useCallback((payload: any) => {
    try {
      const { eventType, new: newRecord } = payload;
      
      if (eventType === 'INSERT' && newRecord) {
        console.log('New message:', newRecord);
        addMessage(newRecord as Message);
      }
    } catch (error) {
      console.error('Error handling message change:', error);
    }
  }, [addMessage]);
  
  const handleAiSuggestionChange = useCallback((payload: any) => {
    try {
      const { eventType, new: newRecord } = payload;
      
      if (eventType === 'INSERT' && newRecord) {
        console.log('New AI suggestion:', newRecord);
        addAiSuggestion(newRecord as AiSuggestion);
      }
    } catch (error) {
      console.error('Error handling AI suggestion change:', error);
    }
  }, [addAiSuggestion]);
  
  // Create subscriptions
  const createSubscriptions = useCallback(async () => {
    if (!currentUser) {
      console.log('No user logged in, skipping subscriptions');
      return false;
    }
    
    try {
      console.log('Creating new subscriptions');
      setIsSubscribed(false);
      
      // Clean up any existing subscriptions first
      channelsRef.current.forEach((channel: any) => {
        if (channel && typeof channel.unsubscribe === 'function') {
          channel.unsubscribe();
        }
      });
      channelsRef.current.clear();
      
      // Create a channel for all conversations for this user
      const conversationsChannel = supabase
        .channel(`user-conversations-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `host_id=eq.${currentUser.id}`
          },
          handleConversationChange
        )
        .subscribe((status) => {
          console.log(`Conversations subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            channelsRef.current.set('conversations', conversationsChannel);
          }
        });
      
      // Create a channel for messages
      const messagesChannel = supabase
        .channel(`user-messages-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          handleMessageChange
        )
        .subscribe((status) => {
          console.log(`Messages subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            channelsRef.current.set('messages', messagesChannel);
          }
        });
      
      // Create a channel for AI suggestions
      const suggestionsChannel = supabase
        .channel(`user-suggestions-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ai_suggestions'
          },
          handleAiSuggestionChange
        )
        .subscribe((status) => {
          console.log(`AI suggestions subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            channelsRef.current.set('suggestions', suggestionsChannel);
          }
        });
      
      // Mark subscription as active
      setIsSubscribed(true);
      setConnectionLost(false);
      return true;
    } catch (error) {
      console.error('Error creating subscriptions:', error);
      setError(`Failed to set up real-time updates: ${error}`);
      return false;
    }
  }, [
    currentUser, 
    setError, 
    handleConversationChange, 
    handleMessageChange, 
    handleAiSuggestionChange
  ]);
  
  // Connection management
  const checkConnection = useCallback(async () => {
    try {
      if (!navigator.onLine) {
        console.log('Browser reports offline');
        setConnectionLost(true);
        return false;
      }
      
      // If already marked as connection lost, try to reconnect
      if (connectionLost) {
        console.log('Attempting to reconnect after connection loss');
        const result = await createSubscriptions();
        return result;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }, [connectionLost, createSubscriptions]);
  
  // Set up subscriptions when user changes
  useEffect(() => {
    if (currentUser) {
      console.log('User logged in, setting up subscriptions');
      createSubscriptions();
      
      // Set up periodic connection check
      connectionCheckTimerRef.current = window.setInterval(
        checkConnection, 
        CONNECTION_CHECK_INTERVAL
      );
    }
    
    // Clean up on unmount or user change
    return () => {
      console.log('Cleaning up subscriptions');
      
      // Clean up all channels
      channelsRef.current.forEach((channel: any) => {
        if (channel && typeof channel.unsubscribe === 'function') {
          channel.unsubscribe();
        }
      });
      
      // Clear all timers
      if (connectionCheckTimerRef.current !== null) {
        window.clearInterval(connectionCheckTimerRef.current);
        connectionCheckTimerRef.current = null;
      }
      
      clearAllTimers();
      
      channelsRef.current.clear();
    };
  }, [currentUser, createSubscriptions, checkConnection, clearAllTimers]);
  
  // Return values and functions
  return {
    loading,
    isTimedOut: fetchTimeouts,
    refetch: {
      fetchConversations,
      fetchMessages,
      fetchAiSuggestions
    }
  };
};

// Helper function to get a conversation by ID from services
const getConversationById = useCallback((conversationId: string) => {
  if (!currentUser) return null;
  
  return supabase
    .from('conversations')
    .select(`
      *,
      property:property_id(*),
      guest:guest_id(*),
      last_message:messages(*)
    `)
    .eq('id', conversationId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error(`Error fetching conversation ${conversationId}:`, error);
        return null;
      }
      return data as ConversationWithDetails;
    })
    .catch(error => {
      console.error(`Unexpected error fetching conversation ${conversationId}:`, error);
      return null;
    });
}, [currentUser]);

export const useSupabaseData = () => {
  const { 
    currentUser,
    setConversations,
    setMessages,
    setAiSuggestions
  } = useAppStore();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchTimeouts, setFetchTimeouts] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // Helper to add timeouts to async operations
  const withTimeout = useCallback(<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T | null> => {
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<null>((_, reject) => {
      timeoutId = setTimeout(() => {
        setFetchTimeouts(true);
        reject(new Error(`${operationName} operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    return Promise.race([
      promise,
      timeoutPromise
    ])
      .then((result) => {
        clearTimeout(timeoutId);
        return result;
      })
      .catch((error) => {
        console.error(`Error in ${operationName}:`, error);
        clearTimeout(timeoutId);
        return null;
      });
  }, []);
  
  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    
    try {
      // Use the appropriate service function to get conversations
      const result = await withTimeout(
        getConversationsByUserId(currentUser.id),
        FETCH_TIMEOUT,
        'Fetch conversations'
      );
      
      if (result) {
        setConversations(result);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, withTimeout, setConversations]);
  
  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      const result = await withTimeout(
        getMessagesByConversationId(conversationId),
        FETCH_TIMEOUT,
        'Fetch messages'
      );
      
      if (result) {
        setMessages(conversationId, result || []);
      }
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
    }
  }, [withTimeout, setMessages]);
  
  // Fetch AI suggestions for a specific conversation
  const fetchAiSuggestions = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      const result = await withTimeout(
        getSuggestionsByConversationId(conversationId),
        FETCH_TIMEOUT,
        'Fetch AI suggestions'
      );
      
      if (result) {
        setAiSuggestions(conversationId, result || []);
      }
    } catch (error) {
      console.error(`Error fetching AI suggestions for conversation ${conversationId}:`, error);
    }
  }, [withTimeout, setAiSuggestions]);
  
  // Load data on component mount
  useEffect(() => {
    if (!currentUser) return;
    
    const loadAllData = async () => {
      try {
        await fetchConversations();
        setFetchTimeouts(false); // Reset timeout state if successful
      } catch (error) {
        console.error('Error in initial data load:', error);
        
        // Retry with exponential backoff if we encounter errors
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        if (newRetryCount <= 3) {
          console.log(`Retrying data load in ${1000 * Math.pow(2, retryCount)}ms (attempt ${newRetryCount}/3)`);
          setTimeout(loadAllData, 1000 * Math.pow(2, retryCount));
        }
      }
    };

    loadAllData();
    
    // Cleanup on unmount
    return () => {
      // Clear all timers
      clearTimeout(timeoutId);
    };
  }, [currentUser, fetchConversations, retryCount]);

  return { 
    loading, 
    isTimedOut: fetchTimeouts,
    refetch: { 
      fetchConversations, 
      fetchMessages, 
      fetchAiSuggestions 
    } 
  };
};

// Example implementation:
const setupSubscriptions = useCallback(() => {
  if (!currentUser) return;
  
  // Create channels for messages
  const messagesChannel = supabase
    .channel(`user-messages-${currentUser.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      handleMessageChange
    )
    .subscribe();
    
  // Create channels for AI suggestions  
  const suggestionsChannel = supabase
    .channel(`user-suggestions-${currentUser.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_suggestions'
      },
      handleAiSuggestionChange
    )
    .subscribe();
    
  // Store channels for cleanup
  channelsRef.current.set('messages', messagesChannel);
  channelsRef.current.set('suggestions', suggestionsChannel);
}, [currentUser, handleMessageChange, handleAiSuggestionChange]);

// Call this in useEffect
useEffect(() => {
  setupSubscriptions();
  // ...rest of effect
}, [setupSubscriptions]);
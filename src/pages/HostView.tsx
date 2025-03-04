import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MainLayout from '../components/layout/MainLayout';
import { useAppStore } from '../store';
import ConversationList from '../components/conversations/ConversationList';
import ConversationDetails from '../components/conversations/ConversationDetails';
import AiResponsePanel from '../components/suggestions/AiResponsePanel';
import NewConversationModal from '../components/modals/NewConversationModal';
import { NewConversationData, Message, AiSuggestion } from '../types';
import { useSupabaseSubscriptions, useSupabaseData } from '../hooks/useSupabase';
import { createMessage, createAiSuggestion, markSuggestionAsUsed, createConversation } from '../services';
import { getAiSuggestion as fetchVectorShiftSuggestion } from '../lib/vectorshift';
import LoadingScreen from '../components/shared/LoadingScreen';
import ErrorAlert from '../components/shared/ErrorAlert';
import ConnectionStatus from '../components/shared/ConnectionStatus';
import ConnectivityMonitor from '../components/shared/ConnectivityMonitor';
import { refreshSupabaseConnection } from '../lib/supabase';

const HostView: React.FC = () => {
  // Get state from the main app store
  const {
    currentUser,
    conversations,
    activeConversationId,
    setActiveConversation,
    getMessagesForActiveConversation,
    getAiSuggestionForActiveConversation,
    markSuggestionAsUsed: markSuggestionAsUsedInStore,
    error,
    clearError,
    selectedPlatform,
    setSelectedPlatform
  } = useAppStore();
  
  // Local state
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [currentAiTone, setCurrentAiTone] = useState<'positive' | 'neutral' | 'formal'>('positive');
  const [currentLanguage, setCurrentLanguage] = useState<'english' | 'french'>('english');
  
  // Get the loading states and refetch functions from Supabase data hook
  const { loading, isTimedOut, refetch } = useSupabaseSubscriptions();
  
  // Derived state
  const messages = getMessagesForActiveConversation();
  const currentAiSuggestion = getAiSuggestionForActiveConversation();
  const currentConversation = conversations.find(c => c.id === activeConversationId) || null;
  
  // Add useState for error management if you're not using store
  const [localError, setError] = useState<string | null>(null);
  
  // Handler to open a conversation
  const handleConversationSelect = useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
  }, [setActiveConversation]);
  
  // Handler for sending messages
  const handleSendMessage = useCallback(async (content: string) => {
    if (!currentUser || !activeConversationId) return;
    
    const newMessage: Omit<Message, 'id' | 'created_at' | 'status'> = {
      conversation_id: activeConversationId,
      sender_id: currentUser.id,
      content,
      is_from_host: true
    };
    
    try {
      await createMessage(newMessage);
      
      // Generate and save AI suggestion
      setIsGeneratingResponse(true);
      
      // Fetch all context for the conversation to provide to Vector Shift
      const conversationContext = messages
        .map(m => `${m.is_from_host ? 'Host' : 'Guest'}: ${m.content}`)
        .join('\n');
      
      const aiSuggestion = await createAiSuggestion(
        activeConversationId,
        conversationContext + `\nGuest: ${content}`,
        currentConversation?.vectorshift_conversation_id
      );
      
      setIsGeneratingResponse(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsGeneratingResponse(false);
    }
  }, [currentUser, activeConversationId, messages, currentConversation]);
  
  // Handler for accepting AI suggestions
  const handleAcceptSuggestion = useCallback(async (content: string) => {
    if (!currentAiSuggestion) return;
    
    // Send the suggestion as a message
    await handleSendMessage(content);
    
    // Mark the suggestion as used
    if (currentAiSuggestion.id) {
      await markSuggestionAsUsed(currentAiSuggestion.id);
      markSuggestionAsUsedInStore();
    }
  }, [currentAiSuggestion, handleSendMessage, markSuggestionAsUsedInStore]);
  
  // Handler for discarding AI suggestions
  const handleDiscardSuggestion = useCallback(() => {
    if (!currentAiSuggestion?.id) return;
    
    // Pass the suggestion ID to the store function
    markSuggestionAsUsedInStore(currentAiSuggestion.id);
  }, [currentAiSuggestion, markSuggestionAsUsedInStore]);
  
  // Handler for creating a new conversation
  const handleCreateConversation = useCallback(async (data: NewConversationData) => {
    if (!currentUser) return;
    
    try {
      const conversation = await createConversation(currentUser.id, data);
      
      if (conversation) {
        setIsNewConversationModalOpen(false);
        setActiveConversation(conversation.id);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }, [currentUser, setActiveConversation]);
  
  // Handlers for AI suggestion regeneration
  const handleGenerateAiResponse = useCallback(async () => {
    if (!activeConversationId || !messages.length) return;
    
    setIsGeneratingResponse(true);
    
    try {
      // Get the last message from the guest
      const lastGuestMessage = [...messages]
        .reverse()
        .find(m => !m.is_from_host);
      
      if (!lastGuestMessage) {
        console.warn('No guest message found to generate a response for');
        setIsGeneratingResponse(false);
        return;
      }
      
      // Fetch all context for the conversation
      const conversationContext = messages
        .map(m => `${m.is_from_host ? 'Host' : 'Guest'}: ${m.content}`)
        .join('\n');
      
      await createAiSuggestion(
        activeConversationId,
        conversationContext,
        currentConversation?.vectorshift_conversation_id
      );
    } catch (error) {
      console.error('Error generating AI response:', error);
    } finally {
      setIsGeneratingResponse(false);
    }
  }, [activeConversationId, messages, currentConversation]);
  
  const handleRegenerateAiResponse = useCallback(async () => {
    // Just call the same function for now
    handleGenerateAiResponse();
  }, [handleGenerateAiResponse]);
  
  // Handler for edited AI suggestions
  const handleEditSuggestion = useCallback(async (content: string) => {
    if (!currentAiSuggestion) return;
    
    // Mark the original as used and send the edited version
    if (currentAiSuggestion.id) {
      await markSuggestionAsUsed(currentAiSuggestion.id);
      markSuggestionAsUsedInStore();
    }
    
    // Send the edited version as a message
    await handleSendMessage(content);
  }, [currentAiSuggestion, handleSendMessage, markSuggestionAsUsedInStore]);
  
  // Handler for custom messages
  const handleSendCustomMessage = useCallback(async (content: string) => {
    // Just a direct send
    await handleSendMessage(content);
  }, [handleSendMessage]);
  
  // Platform filter handler
  const handlePlatformSelect = useCallback((platform: 'Airbnb' | 'Booking.com' | 'All') => {
    setSelectedPlatform(platform);
  }, [setSelectedPlatform]);
  
  // Filter conversations by platform if needed
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    
    if (selectedPlatform === 'All') {
      return conversations;
    }
    
    return conversations.filter(c => c.platform === selectedPlatform);
  }, [conversations, selectedPlatform]);
  
  // Handle connection restoration
  const handleConnectionRestored = useCallback(() => {
    console.log('Connection restored');
    setError(null);
  }, [setError]);
  
  // Handle reconnection attempt
  const handleReconnect = useCallback(async () => {
    console.log('Manual reconnection attempt');
    await refreshSupabaseConnection();
    await refreshSubscriptions();
    handleConnectionRestored();
  }, [refreshSubscriptions, handleConnectionRestored]);
  
  // Get the last guest message for context in AI panel
  const lastGuestMessage = useMemo(() => {
    if (!messages || messages.length === 0) return null;
    
    // Find the most recent message from the guest
    return [...messages]
      .reverse()
      .find(m => !m.is_from_host) || null;
  }, [messages]);
  
  // Add this function to handle connection loss if needed
  const refreshSubscriptions = useCallback(async () => {
    console.log('Manually refreshing subscriptions');
    try {
      if (refetch && refetch.fetchConversations) {
        const conversations = await refetch.fetchConversations();
        // Do something with the refreshed conversations if needed
        console.log('Refreshed conversations:', conversations ? conversations.length : 0);
      }
      return true;
    } catch (error) {
      console.error('Error refreshing subscriptions:', error);
      return false;
    }
  }, [refetch]);
  
  if (loading && conversations.length === 0) {
    return <LoadingScreen />;
  }
  
  return (
    <>
      {error && <ErrorAlert message={error} onClose={clearError} />}
      <MainLayout>
        <div className="flex flex-1 h-full overflow-hidden">
          {/* Debug status indicator */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 z-50">
              {loading ? '🟡' : '🟢'} 
              {loading ? 'Connecting...' : 'Connected'}
            </div>
          )}
          
          {/* Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
            {/* Platform filter */}
            <div className="flex space-x-2 p-4 border-b border-gray-200">
              <button
                onClick={() => handlePlatformSelect('All')}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedPlatform === 'All' 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handlePlatformSelect('Airbnb')}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedPlatform === 'Airbnb' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                Airbnb
              </button>
              <button
                onClick={() => handlePlatformSelect('Booking.com')}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedPlatform === 'Booking.com' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                Booking.com
              </button>
            </div>
            
            {/* Conversation list */}
            <ConversationList 
              conversations={filteredConversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleConversationSelect}
              onNewConversation={() => setIsNewConversationModalOpen(true)}
            />
          </div>
          
          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {activeConversationId && currentConversation ? (
              <ConversationDetails
                conversation={currentConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUser={currentUser}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center p-6 max-w-md">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No conversation selected</h3>
                  <p className="text-gray-500 mb-4">
                    Select a conversation from the sidebar or create a new one to get started.
                  </p>
                  <button
                    onClick={() => setIsNewConversationModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Create New Conversation
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* AI suggestion panel */}
          {activeConversationId && currentConversation && (
            <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
              <AiResponsePanel 
                suggestion={currentAiSuggestion}
                isLoading={isGeneratingResponse}
                onAccept={handleAcceptSuggestion}
                onDiscard={handleDiscardSuggestion}
                onEdit={handleEditSuggestion}
                onCustomSend={handleSendCustomMessage}
                onGenerateResponse={handleGenerateAiResponse}
                onRegenerateResponse={handleRegenerateAiResponse}
                tone={currentAiTone}
                language={currentLanguage}
                onToneChange={setCurrentAiTone}
                onLanguageChange={setCurrentLanguage}
                guestMessage={lastGuestMessage}
              />
            </div>
          )}
        </div>
        
        {/* New Conversation Modal */}
        <NewConversationModal 
          isOpen={isNewConversationModalOpen}
          onClose={() => setIsNewConversationModalOpen(false)}
          onSubmit={handleCreateConversation}
        />
        
        {/* Connection Status Banner */}
        <ConnectionStatus onReconnect={handleReconnect} />
        
        {/* Hidden connectivity monitor */}
        <ConnectivityMonitor onConnectionRestored={handleConnectionRestored} />
      </MainLayout>
    </>
  );
};

export default HostView;
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MainLayout from '../components/layout/MainLayout';
import MessageList from '../components/messages/MessageList';
import MessageInput from '../components/messages/MessageInput';
import NewConversationModal from '../components/modals/NewConversationModal';
import { useAppStore } from '../store';
import { Message, NewConversationData } from '../types';
import { useSupabaseSubscriptions, useSupabaseData } from '../hooks/useSupabase';
import { createMessage, createConversation } from '../services';
import { format } from 'date-fns';

const TravelerView: React.FC = () => {
  const { 
    currentUser,
    conversations, 
    activeConversationId,
    setActiveConversation,
    messages,
    addMessage,
    selectedPlatform, 
    setSelectedPlatform 
  } = useAppStore();
  
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  
  // Set up real-time subscriptions and load data
  useSupabaseSubscriptions();
  const loadingStates = useSupabaseData();
  
  // Get the active conversation and its messages
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  
  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!currentUser || !activeConversationId) return;
    
    // Create a temporary message ID
    const tempId = uuidv4();
    
    // Create message object
    const newMessage: Message = {
      id: tempId,
      conversation_id: activeConversationId,
      sender_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
      status: 'sent',
      is_from_host: false
    };
    
    // Add to local state first for immediate UI update
    addMessage(newMessage);
    
    // Send to database
    await createMessage({
      conversation_id: activeConversationId,
      sender_id: currentUser.id,
      content,
      is_from_host: false
    });
  };
  
  // Handle new conversation creation
  const handleCreateConversation = async (data: any) => {
    if (!currentUser) return;
    
    // In traveler view, we're simulating a guest creating a conversation
    // So we need to modify the host_id field (which would normally be set on the server)
    const hosts = conversations
      .filter(c => c.host_id !== currentUser.id)
      .map(c => c.host_id);
    
    // Use a host ID from existing conversations, or just use a default UUID
    const hostId = hosts.length > 0 ? hosts[0] : '00000000-0000-0000-0000-000000000001';
    
    // Convert the form data to the expected format
    const newConversationData: NewConversationData = {
      guest_name: currentUser.username,
      property_name: data.propertyName,
      property_location: data.propertyLocation,
      platform: selectedPlatform,
      check_in_date: data.checkInDate || undefined,
      check_out_date: data.checkOutDate || undefined,
      initial_message: data.initialMessage
    };
    
    // Create the conversation
    const newConversation = await createConversation(hostId, newConversationData);
    
    // Close the modal
    setIsNewConversationModalOpen(false);
    
    // Set the new conversation as active once it's added to the store via subscription
    if (newConversation) {
      setTimeout(() => {
        setActiveConversation(newConversation.id);
      }, 500);
    }
  };
  
  // Filter conversations for the traveler view
  const filteredConversations = conversations.filter(
    conversation => conversation.platform === selectedPlatform
  );
  
  return (
    <MainLayout>
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-700">Booking Platform</h2>
            <h3 className="text-md text-gray-600 mt-1">Message Simulator</h3>
            
            <div className="mt-4 flex space-x-2">
              <button 
                className={`px-4 py-2 text-sm rounded-md ${
                  selectedPlatform === 'Airbnb' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => setSelectedPlatform('Airbnb')}
              >
                Airbnb
              </button>
              <button 
                className={`px-4 py-2 text-sm rounded-md ${
                  selectedPlatform === 'Booking.com' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => setSelectedPlatform('Booking.com')}
              >
                Booking
              </button>
            </div>
            
            <button 
              className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
              onClick={() => setIsNewConversationModalOpen(true)}
            >
              <svg 
                className="mr-2 h-4 w-4" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Conversation
            </button>
          </div>
          
          <div className="py-2">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              CONVERSATIONS
            </h3>
            
            {loadingStates.conversations ? (
              <div className="px-4 py-2">
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-6 bg-slate-200 rounded w-3/4"></div>
                  ))}
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No conversations yet
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      activeConversationId === conversation.id 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveConversation(conversation.id)}
                  >
                    {conversation.property?.name || 'Unknown Property'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {activeConversation && currentUser ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Conversation header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center">
                    <span className="text-indigo-700 font-medium">
                      {activeConversation.property?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {activeConversation.property?.name || 'Unknown Property'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {activeConversation.property?.location || 'Unknown Location'}
                      {activeConversation.check_in_date && (
                        <span> • {format(new Date(activeConversation.check_in_date), 'MMM d')} - {
                          activeConversation.check_out_date 
                            ? format(new Date(activeConversation.check_out_date), 'MMM d')
                            : 'TBD'
                        }</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <MessageList 
                messages={activeMessages} 
                currentUserId={currentUser.id} 
              />
              
              {/* Message input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <MessageInput onSendMessage={handleSendMessage} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">No conversation selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a conversation from the sidebar or create a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal 
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onSubmit={handleCreateConversation}
      />
    </MainLayout>
  );
};

export default TravelerView;
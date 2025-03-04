import React, { useState, useRef, useEffect } from 'react';
import { User, Message, ConversationWithDetails } from '../../types';
import MessageList from '../messages/MessageList';
import MessageInput from '../messages/MessageInput';
import { format } from 'date-fns';

type ConversationDetailsProps = {
  conversation: ConversationWithDetails;
  messages: Message[];
  currentUser?: User | null;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
};

const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  isLoading = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside of the details panel to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

  // Format dates for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 py-3 px-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {conversation.guest?.name || 'Guest'}
          </h2>
          <div className="flex items-center text-sm text-gray-500">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              conversation.platform === 'Airbnb' ? 'bg-red-500' : 'bg-blue-500'
            }`}></span>
            <span>{conversation.platform}</span>
            {conversation.property && (
              <span className="ml-2">• {conversation.property.name}</span>
            )}
          </div>
        </div>
        
        {/* Booking details if available */}
        {(conversation.check_in_date || conversation.check_out_date) && (
          <div className="text-sm text-gray-500">
            {conversation.check_in_date && (
              <div>Check-in: {new Date(conversation.check_in_date).toLocaleDateString()}</div>
            )}
            {conversation.check_out_date && (
              <div>Check-out: {new Date(conversation.check_out_date).toLocaleDateString()}</div>
            )}
          </div>
        )}
      </div>
      
      {/* Message list */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-700 rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-gray-500">Loading messages...</p>
          </div>
        </div>
      ) : (
        <MessageList 
          messages={messages} 
          currentUserId={currentUser?.id || ''} 
        />
      )}
      
      {/* Message input */}
      <div className="border-t border-gray-200 p-4">
        <MessageInput onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};

export default ConversationDetails;
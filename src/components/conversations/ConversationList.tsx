import React from 'react';
import { ConversationWithDetails } from '../../types';

type ConversationListProps = {
  conversations: ConversationWithDetails[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation
}) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Conversations</h2>
        <button
          onClick={onNewConversation}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          New
        </button>
      </div>
      
      <div className="space-y-1 px-2">
        {conversations.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No conversations yet
          </div>
        ) : (
          conversations.map(conversation => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`p-3 rounded-lg cursor-pointer ${
                conversation.id === activeConversationId
                  ? 'bg-indigo-50 border-l-4 border-indigo-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="font-medium text-gray-900">
                  {conversation.guest?.name || 'Guest'}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(conversation.last_message_at || conversation.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex items-center mt-1">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  conversation.platform === 'Airbnb' ? 'bg-red-500' : 'bg-blue-500'
                }`}></span>
                <span className="text-xs text-gray-500">{conversation.platform}</span>
                {conversation.property && (
                  <span className="text-xs text-gray-500 ml-2">• {conversation.property.name}</span>
                )}
              </div>
              
              {/* Last message preview */}
              {conversation.last_message && (
                <div className="text-sm text-gray-500 mt-1 truncate">
                  {conversation.last_message[0]?.content || 'No messages'}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
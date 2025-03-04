import React, { useState } from 'react';
import { AiSuggestion, Message } from '../../types';

type AiResponsePanelProps = {
  suggestion: AiSuggestion | null;
  isLoading: boolean;
  onAccept: (content: string) => void;
  onDiscard: () => void;
  onEdit: (content: string) => void;
  onCustomSend: (content: string) => void;
  onGenerateResponse: () => void;
  onRegenerateResponse: () => void;
  tone?: 'positive' | 'neutral' | 'formal';
  language?: 'english' | 'french';
  onToneChange?: (tone: 'positive' | 'neutral' | 'formal') => void;
  onLanguageChange?: (language: 'english' | 'french') => void;
  guestMessage: Message | null;
};

const AiResponsePanel: React.FC<AiResponsePanelProps> = ({
  suggestion,
  isLoading,
  onAccept,
  onDiscard,
  onEdit,
  onCustomSend,
  onGenerateResponse,
  onRegenerateResponse,
  tone = 'positive',
  language = 'english',
  onToneChange,
  onLanguageChange,
  guestMessage
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [editedSuggestion, setEditedSuggestion] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Handle tone selection
  const handleToneChange = (newTone: 'positive' | 'neutral' | 'formal') => {
    if (onToneChange) {
      onToneChange(newTone);
    }
  };

  // Handle language selection
  const handleLanguageChange = (newLanguage: 'english' | 'french') => {
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  // Start editing the suggestion
  const handleEditClick = () => {
    setEditedSuggestion(suggestion?.content || '');
    setIsEditing(true);
  };

  // Save the edited suggestion
  const handleSaveEdit = () => {
    if (editedSuggestion.trim()) {
      onEdit(editedSuggestion);
    }
    setIsEditing(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditedSuggestion(suggestion?.content || '');
    setIsEditing(false);
  };

  // Send the custom message
  const handleSendCustom = () => {
    if (customMessage.trim()) {
      onCustomSend(customMessage);
      setCustomMessage('');
    }
  };

  // Animated dots for thinking state
  const ThinkingDots = () => {
    return (
      <div className="flex items-center space-x-1 mt-1">
        <span className="animate-bounce delay-0 inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
        <span className="animate-bounce delay-150 inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
        <span className="animate-bounce delay-300 inline-block w-2 h-2 bg-indigo-600 rounded-full"></span>
      </div>
    );
  };

  return (
    <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700">Response Assistant</h2>
        
        <div className="mt-2 flex space-x-2">
          <button 
            className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded ${
              tone === 'positive' 
                ? 'border-transparent text-indigo-700 bg-indigo-100 hover:bg-indigo-200' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleToneChange('positive')}
          >
            <svg
              className="mr-1 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Positive
          </button>
          
          <button 
            className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded ${
              tone === 'neutral' 
                ? 'border-transparent text-indigo-700 bg-indigo-100 hover:bg-indigo-200' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleToneChange('neutral')}
          >
            <svg
              className="mr-1 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm-2-6a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Neutral
          </button>
          
          <button 
            className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded ${
              tone === 'formal' 
                ? 'border-transparent text-indigo-700 bg-indigo-100 hover:bg-indigo-200' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleToneChange('formal')}
          >
            <svg
              className="mr-1 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-8a1 1 0 01-1 1H8a1 1 0 110-2h4a1 1 0 011 1z"
                clipRule="evenodd"
              />
            </svg>
            Formal
          </button>
        </div>
        
        <div className="mt-2 flex space-x-2">
          <button 
            className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded ${
              language === 'english' 
                ? 'border-transparent text-indigo-700 bg-indigo-100 hover:bg-indigo-200' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleLanguageChange('english')}
          >
            <svg
              className="mr-1 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            English
          </button>
          
          <button 
            className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded ${
              language === 'french' 
                ? 'border-transparent text-indigo-700 bg-indigo-100 hover:bg-indigo-200' 
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleLanguageChange('french')}
          >
            <svg
              className="mr-1 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            Français
          </button>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-auto">
        {guestMessage && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700">Guest Message:</h3>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-800 whitespace-pre-line">{guestMessage.content}</p>
            </div>
          </div>
        )}
        
        <h3 className="text-sm font-medium text-gray-700">AI Response:</h3>
        
        {isLoading ? (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg flex flex-col items-center justify-center h-32 space-y-3">
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium text-indigo-700">Assistant is thinking</span>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xs text-gray-500 text-center">Generating a response based on the guest message</p>
              <ThinkingDots />
            </div>
          </div>
        ) : isEditing ? (
          <div className="mt-2">
            <textarea
              value={editedSuggestion}
              onChange={(e) => setEditedSuggestion(e.target.value)}
              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
            />
            <div className="mt-2 flex justify-end space-x-2">
              <button 
                onClick={handleCancelEdit}
                className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : suggestion ? (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-800 whitespace-pre-line">
              {suggestion.content}
            </p>
            <div className="mt-1 flex items-center justify-end">
              <span className="text-xs text-gray-500">
                {language === 'french' ? 'Français' : 'English'} • 
                {tone === 'positive' ? ' Positive' : tone === 'neutral' ? ' Neutral' : ' Formal'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg h-32 flex flex-col items-center justify-center">
            {guestMessage ? (
              <>
                <p className="text-sm text-gray-500 mb-3 text-center">
                  Generate an AI response to answer the guest
                </p>
                <button
                  onClick={onGenerateResponse}
                  disabled={!guestMessage || isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Response
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Select a conversation to see AI-suggested responses
              </p>
            )}
          </div>
        )}
        
        {suggestion && !isEditing && (
          <div className="mt-4 flex space-x-2">
            <button 
              onClick={onDiscard}
              className="flex-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Discard
            </button>
            <button 
              onClick={handleEditClick}
              className="flex-1 px-3 py-2 border border-indigo-200 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Edit
            </button>
            <button 
              onClick={() => onAccept(suggestion.content)}
              className="flex-1 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Send
            </button>
          </div>
        )}
        
        {suggestion && !isEditing && (
          <div className="mt-2">
            <button
              onClick={onRegenerateResponse}
              disabled={isLoading}
              className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate Response
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">Custom Message:</h3>
        <div className="mt-2">
          <textarea
            rows={3}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
            placeholder="Type a custom message..."
          ></textarea>
        </div>
        <div className="mt-2 flex justify-end">
          <button 
            onClick={handleSendCustom}
            disabled={!customMessage.trim()}
            className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md ${
              !customMessage.trim() 
                ? 'border-gray-300 text-gray-400 bg-gray-100' 
                : 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiResponsePanel;
import { create } from 'zustand';
import { User, Conversation, Message, ConversationWithDetails, AiSuggestion } from '../types';

type Platform = 'All' | 'Airbnb' | 'Booking.com';

export type User = {
  id: string;
  email?: string;
  [key: string]: any;
};

type AppState = {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // Conversation state
  conversations: ConversationWithDetails[];
  setConversations: (conversations: ConversationWithDetails[]) => void;
  addConversation: (conversation: ConversationWithDetails) => void;
  updateConversation: (id: string, updates: Partial<ConversationWithDetails>) => void;
  
  // Active conversation state
  activeConversationId: string | null;
  setActiveConversation: (id: string | null) => void;
  
  // Message state
  messagesMap: Record<string, Message[]>;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  
  // Helper methods for accessing data
  getMessagesForActiveConversation: () => Message[];
  
  // AI Suggestion state
  aiSuggestionsMap: Record<string, AiSuggestion[]>;
  setAiSuggestions: (conversationId: string, suggestions: AiSuggestion[]) => void;
  addAiSuggestion: (suggestion: AiSuggestion) => void;
  getAiSuggestionForActiveConversation: () => AiSuggestion | null;
  markSuggestionAsUsed: (suggestionId?: string) => void;
  
  // Platform filter state
  selectedPlatform: Platform;
  setSelectedPlatform: (platform: Platform) => void;
  
  // Error state
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  // User state
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  // Conversation state
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations]
  })),
  updateConversation: (id, updates) => set((state) => {
    const conversations = [...state.conversations];
    const index = conversations.findIndex(c => c.id === id);
    
    if (index !== -1) {
      conversations[index] = {
        ...conversations[index],
        ...updates
      };
    }
    
    return { conversations };
  }),
  
  // Active conversation state
  activeConversationId: null,
  setActiveConversation: (id) => set({ activeConversationId: id }),
  
  // Message state
  messagesMap: {},
  setMessages: (conversationId, messages) => set((state) => ({
    messagesMap: { 
      ...state.messagesMap, 
      [conversationId]: messages 
    }
  })),
  addMessage: (message) => set((state) => {
    const conversationId = message.conversation_id;
    const existingMessages = state.messagesMap[conversationId] || [];
    
    return {
      messagesMap: {
        ...state.messagesMap,
        [conversationId]: [...existingMessages, message]
      }
    };
  }),
  updateMessage: (id, updates) => set((state) => {
    const updatedMap = { ...state.messagesMap };
    
    // Find which conversation contains this message
    for (const [conversationId, messages] of Object.entries(updatedMap)) {
      const updatedMessages = messages.map(m => 
        m.id === id ? { ...m, ...updates } : m
      );
      
      updatedMap[conversationId] = updatedMessages;
    }
    
    return { messagesMap: updatedMap };
  }),
  
  // Helper methods for accessing data
  getMessagesForActiveConversation: () => {
    const { activeConversationId, messagesMap } = get();
    if (!activeConversationId) return [];
    return messagesMap[activeConversationId] || [];
  },
  
  // AI Suggestion state
  aiSuggestionsMap: {},
  setAiSuggestions: (conversationId, suggestions) => set((state) => ({
    aiSuggestionsMap: {
      ...state.aiSuggestionsMap,
      [conversationId]: suggestions
    }
  })),
  addAiSuggestion: (suggestion) => set((state) => {
    const conversationId = suggestion.conversation_id;
    const existingSuggestions = state.aiSuggestionsMap[conversationId] || [];
    
    return {
      aiSuggestionsMap: {
        ...state.aiSuggestionsMap,
        [conversationId]: [...existingSuggestions, suggestion]
      }
    };
  }),
  getAiSuggestionForActiveConversation: () => {
    const { activeConversationId, aiSuggestionsMap } = get();
    if (!activeConversationId) return null;
    
    const suggestions = aiSuggestionsMap[activeConversationId] || [];
    // Return the most recent unused suggestion
    return suggestions
      .filter(s => !s.is_used)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;
  },
  markSuggestionAsUsed: (suggestionId) => set((state) => {
    const { activeConversationId, aiSuggestionsMap } = state;
    if (!activeConversationId) return state;
    
    const suggestions = aiSuggestionsMap[activeConversationId] || [];
    
    // If no specific suggestion ID is provided, mark the most recent one as used
    const updatedSuggestions = suggestions.map(s => {
      if (suggestionId && s.id === suggestionId) {
        return { ...s, is_used: true };
      } else if (!suggestionId && !s.is_used) {
        // If no ID provided, mark the first unused suggestion as used
        return { ...s, is_used: true };
      }
      return s;
    });
    
    return {
      aiSuggestionsMap: {
        ...state.aiSuggestionsMap,
        [activeConversationId]: updatedSuggestions
      }
    };
  }),
  
  // Platform filter state
  selectedPlatform: 'All' as Platform,
  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
  
  // Error state
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  // Loading state
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading })
}));
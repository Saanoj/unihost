// Export all services
export * from './supabase/users';
export * from './supabase/properties';
export * from './supabase/conversations';
export * from './supabase/messages';
export * from './supabase/aiSuggestions';

export {
  createMessage,
  getMessagesByConversationId,
  updateMessageStatus
} from './supabase/messages';

export {
  createAiSuggestion,
  getSuggestionsByConversationId,
  markSuggestionAsUsed
} from './supabase/aiSuggestions';

export {
  getConversationsByUserId,
  getConversationsByHostId,
  getConversationById,
  createConversation,
  updateConversation
} from './supabase/conversations';
import { supabase } from '../../lib/supabase';
import { AiSuggestion } from '../../types';
import { fetchAiSuggestion } from '../../lib/vectorshift';
import { updateVectorshiftConversationId } from './conversations';

export const createAiSuggestion = async (
  conversationId: string,
  messageContent: string,
  vectorshiftConversationId?: string
): Promise<AiSuggestion | null> => {
  try {
    // Get suggestion from VectorShift
    const suggestion = await fetchAiSuggestion(messageContent, vectorshiftConversationId);
    
    if (!suggestion) {
      console.error('Failed to get AI suggestion from VectorShift API');
      return null;
    }
    
    // Create new suggestion in database
    const { data, error } = await supabase
      .from('ai_suggestions')
      .insert({
        conversation_id: conversationId,
        content: suggestion.content,
        is_used: false,
        vectorshift_conversation_id: suggestion.conversation_id
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating AI suggestion in database:', error);
      return null;
    }
    
    // If we got a new conversation ID from VectorShift, update it in the main conversation
    if (suggestion.conversation_id && !vectorshiftConversationId) {
      await updateVectorshiftConversationId(conversationId, suggestion.conversation_id);
    }
    
    return data as AiSuggestion;
  } catch (error) {
    console.error('Unexpected error creating AI suggestion:', error);
    return null;
  }
};

export const getSuggestionsByConversationId = async (conversationId: string): Promise<AiSuggestion[]> => {
  try {
    if (!conversationId) {
      console.error('Cannot get suggestions: missing conversation ID');
      return [];
    }

    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching AI suggestions:', error);
      return [];
    }
    
    return data as AiSuggestion[] || [];
  } catch (error) {
    console.error(`Unexpected error fetching AI suggestions for conversation ${conversationId}:`, error);
    return [];
  }
};

export const markSuggestionAsUsed = async (suggestionId: string): Promise<boolean> => {
  try {
    if (!suggestionId) {
      console.error('Cannot mark suggestion as used: missing suggestion ID');
      return false;
    }

    const { error } = await supabase
      .from('ai_suggestions')
      .update({ is_used: true })
      .eq('id', suggestionId);
    
    if (error) {
      console.error('Error marking suggestion as used:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Unexpected error marking suggestion ${suggestionId} as used:`, error);
    return false;
  }
};

// Get the latest AI suggestion for a conversation
export const getLatestSuggestion = async (conversationId: string): Promise<AiSuggestion | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No suggestions found - this is not an error
        return null;
      }
      console.error('Error fetching latest AI suggestion:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching latest AI suggestion:', error);
    return null;
  }
};
import { supabase } from '../../lib/supabase';
import { Message, MessageRequest } from '../../types';
import { updateConversationLastMessageTime } from './conversations';

export const createMessage = async (messageData: MessageRequest): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return null;
    }

    // Update the conversation's last_message_at timestamp
    await updateConversationLastMessageTime(messageData.conversation_id);

    return data;
  } catch (error) {
    console.error('Unexpected error creating message:', error);
    return null;
  }
};

export const getMessagesByConversationId = async (conversationId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    
    return data as Message[] || [];
  } catch (error) {
    console.error(`Unexpected error fetching messages for conversation ${conversationId}:`, error);
    return [];
  }
};

export const updateMessageStatus = async (messageId: string, status: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ status })
      .eq('id', messageId);
    
    if (error) {
      console.error('Error updating message status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Unexpected error updating message ${messageId} status:`, error);
    return false;
  }
};
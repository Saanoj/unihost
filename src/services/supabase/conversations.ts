import { supabase } from '../../lib/supabase';
import { Conversation, ConversationWithDetails, NewConversationData, Message, Platform } from '../../types';
import { v4 as uuidv4 } from 'uuid';

async function createConversationImpl(
  hostId: string,
  newConversationData: NewConversationData
): Promise<Conversation | null> {
  try {
    // First verify the host exists
    const { data: hostData, error: hostError } = await supabase
      .from('users')
      .select('id')
      .eq('id', hostId)
      .single();
    
    if (hostError) {
      console.error('Error: Host user does not exist:', hostError);
      
      // Create the host user if it doesn't exist (only for demo/mock purposes)
      if (hostId === '00000000-0000-0000-0000-000000000001') {
        const { data: newHost, error: createHostError } = await supabase
          .from('users')
          .insert([{
            id: hostId, // Use the provided UUID
            username: 'host_user',
            email: 'host@example.com',
            is_host: true
          }])
          .select()
          .single();
          
        if (createHostError) {
          console.error('Error creating host user:', createHostError);
          return null;
        }
        
        console.log('Created mock host user for demo purposes');
      } else {
        return null;
      }
    }

    // Generate a unique email to avoid conflicts
    const uniqueId = uuidv4().substring(0, 8);
    const guestEmail = `${newConversationData.guest_name.toLowerCase().replace(/\s+/g, '.')}.${uniqueId}@example.com`;
    
    // First try to get existing guest user by username
    let guestData;
    try {
      // Check if user exists with this username
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', newConversationData.guest_name);
      
      // Handle PGRST116 error - "no rows found" is normal here
      if (!fetchError && existingUser && existingUser.length > 0) {
        console.log('Using existing user');
        guestData = existingUser[0]; // Take the first user with this username
      } else {
        // Create a new guest user with unique email
        const { data, error } = await supabase
          .from('users')
          .insert([{
            username: newConversationData.guest_name,
            email: guestEmail,
            is_host: false
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating guest user:', error);
          throw new Error('Cannot create guest user');
        }
        
        guestData = data;
      }
    } catch (error) {
      console.error('Error in guest user creation/lookup:', error);
      return null;
    }

    if (!guestData || !guestData.id) {
      console.error('Failed to get valid guest data');
      return null;
    }

    // Create property if it doesn't exist
    let propertyData;
    try {
      // First try to get existing property
      const { data: existingProperty, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('name', newConversationData.property_name)
        .eq('host_id', hostId);

      if (!fetchError && existingProperty && existingProperty.length > 0) {
        console.log('Using existing property');
        propertyData = existingProperty[0]; // Take the first property matching criteria
      } else {
        // Create new property if it doesn't exist
        const { data, error } = await supabase
          .from('properties')
          .insert([{
            name: newConversationData.property_name,
            location: newConversationData.property_location,
            host_id: hostId,
            platform: newConversationData.platform
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating property:', error);
          throw new Error('Cannot create property');
        }
        
        propertyData = data;
      }
    } catch (error) {
      console.error('Error in property creation/lookup:', error);
      return null;
    }

    if (!propertyData || !propertyData.id) {
      console.error('Failed to get valid property data');
      return null;
    }

    // Generate a timestamp for last_message_at
    const now = new Date().toISOString();

    // Create the conversation
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .insert([{
        property_id: propertyData.id,
        guest_id: guestData.id,
        host_id: hostId,
        platform: newConversationData.platform,
        check_in_date: newConversationData.check_in_date,
        check_out_date: newConversationData.check_out_date,
        last_message_at: now
      }])
      .select()
      .single();

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      return null;
    }

    // Add initial message from guest
    if (newConversationData.initial_message) {
      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationData.id,
          sender_id: guestData.id,
          content: newConversationData.initial_message,
          is_from_host: false,
          created_at: now
        }]);

      if (messageError) {
        console.error('Error adding initial message:', messageError);
      }
    }

    // Fetch the complete conversation with details for proper return type
    const { data: fullConversation, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        *,
        property:properties(*),
        guest:users!conversations_guest_id_fkey(*)
      `)
      .eq('id', conversationData.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete conversation:', fetchError);
      return conversationData; // Return basic conversation if we can't get full details
    }

    return fullConversation;
  } catch (error) {
    console.error('Unexpected error creating conversation:', error);
    return null;
  }
}

export { createConversationImpl as createConversation };

export const getConversationsWithDetails = async (userId: string): Promise<ConversationWithDetails[] | null> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        property:properties(*),
        guest:users!conversations_guest_id_fkey(*)
      `)
      .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching conversations:', error);
    return null;
  }
};

export const getConversationById = async (conversationId: string): Promise<ConversationWithDetails | null> => {
  try {
    if (!conversationId) {
      console.error('Cannot get conversation: missing conversation ID');
      return null;
    }

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        property:property_id(*),
        guest:guest_id(*),
        last_message:messages(*)
      `)
      .eq('id', conversationId)
      .single();
    
    if (error) {
      console.error(`Error fetching conversation ${conversationId}:`, error);
      return null;
    }
    
    return data as ConversationWithDetails;
  } catch (error) {
    console.error(`Unexpected error fetching conversation ${conversationId}:`, error);
    return null;
  }
};

export const updateConversationLastMessageTime = async (conversationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation last message time:', error);
    }
  } catch (error) {
    console.error('Unexpected error updating conversation:', error);
  }
};

export const updateVectorshiftConversationId = async (
  conversationId: string,
  vectorshiftConversationId: string
): Promise<boolean> => {
  try {
    if (!conversationId || !vectorshiftConversationId) {
      console.error('Cannot update vectorshift conversation ID: missing required parameters');
      return false;
    }

    return await updateConversation(conversationId, { 
      vectorshift_conversation_id: vectorshiftConversationId 
    });
  } catch (error) {
    console.error(`Unexpected error updating vectorshift conversation ID for conversation ${conversationId}:`, error);
    return false;
  }
};

export const getConversationsByUserId = async (userId: string): Promise<ConversationWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        property:property_id(*),
        guest:guest_id(*),
        last_message:messages(*)
      `)
      .eq('host_id', userId)
      .order('last_message_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching conversations by user ID:', error);
      return [];
    }
    
    return data as ConversationWithDetails[] || [];
  } catch (error) {
    console.error(`Unexpected error fetching conversations for user ${userId}:`, error);
    return [];
  }
};

export const getConversationsByHostId = async (hostId: string): Promise<ConversationWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        property:property_id(*),
        guest:guest_id(*),
        last_message:messages(*)
      `)
      .eq('host_id', hostId)
      .order('last_message_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching conversations by host ID:', error);
      return [];
    }
    
    return data as ConversationWithDetails[] || [];
  } catch (error) {
    console.error(`Unexpected error fetching conversations for host ${hostId}:`, error);
    return [];
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
    
    return data as Message[] || []; // Ensure we always return an array
  } catch (error) {
    console.error(`Unexpected error fetching messages for conversation ${conversationId}:`, error);
    return [];
  }
};

export const updateConversation = async (
  conversationId: string, 
  updates: Partial<Conversation>
): Promise<boolean> => {
  try {
    if (!conversationId) {
      console.error('Cannot update conversation: missing conversation ID');
      return false;
    }

    const { error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId);
    
    if (error) {
      console.error(`Error updating conversation ${conversationId}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Unexpected error updating conversation ${conversationId}:`, error);
    return false;
  }
};

export {
  getConversationsByUserId,
  getConversationsByHostId,
  getConversationById,
  createConversation,
  updateConversation,
  updateVectorshiftConversationId
};
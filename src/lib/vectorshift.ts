import axios from 'axios';

const API_URL = import.meta.env.VITE_VECTORSHIFT_API_URL;
const API_KEY = import.meta.env.VITE_VECTORSHIFT_API_KEY;
const CHATBOT_ID = import.meta.env.VITE_VECTORSHIFT_CHATBOT_ID;

if (!API_URL || !API_KEY || !CHATBOT_ID) {
  console.error('Missing VectorShift API environment variables. Please check your .env file.');
}

// Define the API response type properly
export interface VectorShiftResponse {
  content: string;
  conversation_id?: string;
  success?: boolean;
}

// Smart fallback responses based on common message patterns
const getFallbackResponse = (messageContent: string = ''): string => {
  const lowerMessage = messageContent.toLowerCase();
  
  if (lowerMessage.includes('check') && (lowerMessage.includes('in') || lowerMessage.includes('out'))) {
    return "Thank you for your inquiry about check-in/check-out times. Our standard check-in time is 3 PM and check-out is 11 AM. Let me know if you need any flexibility with these times, and I'll do my best to accommodate your needs.";
  }
  
  if (lowerMessage.includes('wifi') || lowerMessage.includes('internet')) {
    return "Yes, high-speed WiFi is available throughout the property. The network name and password will be provided in your welcome guide upon arrival.";
  }
  
  if (lowerMessage.includes('park') || lowerMessage.includes('parking')) {
    return "There is free parking available on the premises. You'll have a dedicated spot for your vehicle during your stay.";
  }
  
  if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
    return "Regarding cancellations, our policy allows for a full refund if canceled 5 days before arrival. Please check the booking details for the complete cancellation policy.";
  }
  
  // Default response
  return "Thank you for your message. I'll respond to your inquiry as soon as possible. If you have any urgent questions, please don't hesitate to let me know.";
};

// Check for network connectivity before making requests
const isNetworkAvailable = (): boolean => {
  return navigator.onLine;
};

// Add logging to track API call attempts
const logApiCall = (action: string, data: any = {}) => {
  console.log(`VectorShift API: ${action}`, data);
};

export const fetchAiSuggestion = async (
  messageContent: string,
  vectorshiftConversationId?: string
): Promise<VectorShiftResponse | null> => {
  try {
    if (!messageContent) {
      console.error('Cannot get AI suggestion: missing message content');
      return null;
    }

    // Mock API call for development/testing
    // Replace with actual API call in production
    console.log('Fetching AI suggestion for message:', messageContent);
    
    // Simulating API response structure with success field
    return {
      content: `This is an AI suggestion for: "${messageContent}"`,
      conversation_id: vectorshiftConversationId || 'new_conversation',
      success: true
    };
  } catch (error) {
    console.error('Error fetching AI suggestion from VectorShift:', error);
    return null;
  }
};

// Alias for backward compatibility
export const getAiSuggestion = fetchAiSuggestion;

// Function to get multiple response options with different tones
export const getAiSuggestionVariations = async (
  messageContent: string,
  tones: string[],
  conversationId?: string
): Promise<Record<string, string>> => {
  const variations: Record<string, string> = {};
  
  // Check network status upfront
  if (!isNetworkAvailable()) {
    console.warn('Network unavailable, using fallback responses for all tones');
    return tones.reduce((acc, tone) => {
      acc[tone] = getFallbackResponse(messageContent);
      return acc;
    }, {} as Record<string, string>);
  }
  
  try {
    // Request suggestions for each tone in parallel
    const requests = tones.map(async (tone) => {
      try {
        const contextualizedContent = `[Respond with a ${tone} tone] ${messageContent}`;
        const suggestion = await getAiSuggestion(contextualizedContent, conversationId);
        return { tone, response: suggestion?.content || getFallbackResponse(messageContent) };
      } catch (error) {
        // Handle individual tone request errors
        console.warn(`Error getting suggestion for ${tone} tone:`, error);
        return { tone, response: getFallbackResponse(messageContent) };
      }
    });
    
    const results = await Promise.all(requests);
    
    // Convert results to the expected format
    results.forEach(result => {
      variations[result.tone] = result.response;
    });
    
    return variations;
  } catch (error) {
    // Safely handle error logging to prevent Symbol cloning issues
    const safeError = error instanceof Error 
      ? { message: error.message, name: error.name } 
      : { message: 'Unknown error' };
    
    console.error('Error getting AI suggestion variations:', safeError);
    
    // Provide fallback responses for all tones
    return tones.reduce((acc, tone) => {
      acc[tone] = getFallbackResponse(messageContent);
      return acc;
    }, {} as Record<string, string>);
  }
};
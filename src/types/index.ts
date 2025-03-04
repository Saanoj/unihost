export type User = {
  id: string;
  username: string;
  avatar_url?: string;
  email: string;
  created_at: string;
  is_host: boolean;
};

export type Property = {
  id: string;
  name: string;
  location: string;
  host_id: string;
  platform: 'Airbnb' | 'Booking.com';
};

export type Conversation = {
  id: string;
  property_id: string;
  guest_id: string;
  host_id: string;
  last_message_at: string;
  created_at: string;
  platform: 'Airbnb' | 'Booking.com';
  check_in_date?: string;
  check_out_date?: string;
  vectorshift_conversation_id?: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
  is_from_host: boolean;
};

export type AiSuggestion = {
  id: string;
  conversation_id: string;
  content: string;
  created_at: string;
  used: boolean;
};

export type MessageRequest = Omit<Message, 'id' | 'created_at' | 'status'>;

export type ConversationWithDetails = Conversation & {
  property?: {
    id: string;
    name: string;
    address?: string;
    [key: string]: any; // For other property fields
  } | null;
  guest?: {
    id: string;
    name: string;
    email?: string;
    [key: string]: any; // For other guest fields
  } | null;
  last_message?: Message[] | null;
};

export type Platform = 'Airbnb' | 'Booking.com' | 'All';

export type NewConversationData = {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkInDate?: string;
  checkOutDate?: string;
  platform: Exclude<Platform, 'All'>;  // Don't allow 'All' for new conversations
};
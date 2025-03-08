export interface ConversationSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ConversationMessage[];
  isActive?: boolean;
}

export interface ConversationMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

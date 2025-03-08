export interface ConversationMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}
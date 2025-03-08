import { ConversationMessage } from './conversation-message';

export class ConversationSession {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  
  constructor(data: Partial<ConversationSession> = {}) {
    this.id = data.id || crypto.randomUUID();
    this.title = data.title || 'New Conversation';
    this.messages = data.messages || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}

export { ConversationMessage };
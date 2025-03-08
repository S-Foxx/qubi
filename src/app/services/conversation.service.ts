import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConversationSession } from '../models/conversation-session';
import { ConversationMessage } from '../models/conversation-message';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private conversations: ConversationSession[] = [];
  private activeConversationSubject = new BehaviorSubject<ConversationSession | null>(null);
  public activeConversation$ = this.activeConversationSubject.asObservable();

  constructor() {
    // Load conversations from storage if available
    this.loadConversations();
  }

  private loadConversations(): void {
    const storedConversations = localStorage.getItem('conversations');
    if (storedConversations) {
      try {
        const parsedConversations = JSON.parse(storedConversations);
        this.conversations = parsedConversations.map((conv: any) => {
          const session = new ConversationSession(conv);
          // Convert string dates to Date objects
          session.createdAt = new Date(conv.createdAt);
          session.updatedAt = new Date(conv.updatedAt);
          session.messages = conv.messages.map((msg: any) => {
            return {
              ...msg,
              timestamp: new Date(msg.timestamp)
            };
          });
          return session;
        });
      } catch (e) {
        console.error('Error parsing stored conversations:', e);
        this.conversations = [];
      }
    }
  }

  private saveConversations(): void {
    localStorage.setItem('conversations', JSON.stringify(this.conversations));
  }

  getAllConversations(): ConversationSession[] {
    return [...this.conversations];
  }

  getConversation(id: string): ConversationSession | undefined {
    return this.conversations.find(conv => conv.id === id);
  }

  createNewConversation(): ConversationSession {
    const newConversation = new ConversationSession();
    this.conversations.unshift(newConversation);
    this.saveConversations();
    this.setActiveConversation(newConversation.id);
    return newConversation;
  }

  setActiveConversation(conversationId: string): void {
    const conversation = this.getConversation(conversationId);
    this.activeConversationSubject.next(conversation || null);
  }

  addMessage(conversationId: string, messageData: Omit<ConversationMessage, 'id'>): string {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return '';

    const messageId = crypto.randomUUID();
    const message: ConversationMessage = {
      id: messageId,
      ...messageData
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();
    this.saveConversations();
    
    // Update the active conversation if needed
    if (this.activeConversationSubject.value?.id === conversationId) {
      this.activeConversationSubject.next({ ...conversation });
    }
    
    return messageId;
  }

  updateMessage(conversationId: string, messageId: string, text: string): void {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    conversation.messages[messageIndex].text = text;
    conversation.updatedAt = new Date();
    this.saveConversations();
    
    // Update the active conversation if needed
    if (this.activeConversationSubject.value?.id === conversationId) {
      this.activeConversationSubject.next({ ...conversation });
    }
  }

  deleteConversation(conversationId: string): void {
    const index = this.conversations.findIndex(conv => conv.id === conversationId);
    if (index !== -1) {
      this.conversations.splice(index, 1);
      this.saveConversations();
      
      // If the deleted conversation was active, set active to null
      if (this.activeConversationSubject.value?.id === conversationId) {
        this.activeConversationSubject.next(null);
      }
    }
  }
}
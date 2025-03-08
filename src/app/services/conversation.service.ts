import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConversationSession, ConversationMessage } from '../models/conversation-session.model';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private conversations: ConversationSession[] = [];
  private activeConversationSubject = new BehaviorSubject<ConversationSession | null>(null);
  
  public activeConversation$ = this.activeConversationSubject.asObservable();

  constructor() {
    this.loadConversations();
  }

  private loadConversations(): void {
    // In a real app, this would load from storage or API
    // For now, we'll create a sample conversation
    if (this.conversations.length === 0) {
      const initialConversation = this.createNewConversation();
      this.setActiveConversation(initialConversation.id);
    }
  }

  public getConversations(): ConversationSession[] {
    return [...this.conversations];
  }

  public getConversation(id: string): ConversationSession | undefined {
    return this.conversations.find(conv => conv.id === id);
  }

  public createNewConversation(): ConversationSession {
    const newConversation: ConversationSession = {
      id: this.generateId(),
      title: 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [{
        id: this.generateId(),
        text: 'Hello, how can I help you today?',
        sender: 'bot',
        timestamp: new Date()
      }]
    };

    this.conversations.unshift(newConversation);
    this.setActiveConversation(newConversation.id);
    this.saveConversations();
    
    return newConversation;
  }

  public setActiveConversation(id: string): void {
    // Reset isActive flag for all conversations
    this.conversations.forEach(conv => conv.isActive = false);
    
    // Set the active conversation
    const conversation = this.conversations.find(conv => conv.id === id);
    if (conversation) {
      conversation.isActive = true;
      this.activeConversationSubject.next(conversation);
    }
    
    this.saveConversations();
  }

  public updateConversationTitle(id: string, title: string): void {
    const conversation = this.conversations.find(conv => conv.id === id);
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = new Date();
      this.saveConversations();
      
      // Update the active conversation if this is the active one
      if (conversation.isActive) {
        this.activeConversationSubject.next(conversation);
      }
    }
  }

  public deleteConversation(id: string): void {
    const index = this.conversations.findIndex(conv => conv.id === id);
    if (index !== -1) {
      const wasActive = this.conversations[index].isActive;
      this.conversations.splice(index, 1);
      
      // If we deleted the active conversation, set a new active one
      if (wasActive && this.conversations.length > 0) {
        this.setActiveConversation(this.conversations[0].id);
      } else if (this.conversations.length === 0) {
        this.activeConversationSubject.next(null);
      }
      
      this.saveConversations();
    }
  }

  public addMessage(conversationId: string, message: Omit<ConversationMessage, 'id'>): void {
    const conversation = this.conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      const newMessage: ConversationMessage = {
        ...message,
        id: this.generateId()
      };
      
      conversation.messages.push(newMessage);
      conversation.updatedAt = new Date();
      this.saveConversations();
      
      // Update the active conversation if this is the active one
      if (conversation.isActive) {
        this.activeConversationSubject.next({...conversation});
      }
    }
  }

  private saveConversations(): void {
    // In a real app, this would save to storage or API
    // For now, we'll just log to console
    console.log('Saving conversations:', this.conversations);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

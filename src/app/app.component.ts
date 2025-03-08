import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConversationService } from './services/conversation.service';
import { ConversationSession } from './models/conversation-session.model';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  public appPages = [
    { title: 'Inbox', url: '/folder/inbox', icon: 'mail' },
    { title: 'Outbox', url: '/folder/outbox', icon: 'paper-plane' },
    { title: 'Favorites', url: '/folder/favorites', icon: 'heart' },
    { title: 'Archived', url: '/folder/archived', icon: 'archive' },
    { title: 'Trash', url: '/folder/trash', icon: 'trash' },
    { title: 'Spam', url: '/folder/spam', icon: 'warning' },
  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  public conversations: ConversationSession[] = [];
  public editingConversation: ConversationSession | null = null;

  private conversationService = inject(ConversationService);
  private router = inject(Router);

  constructor() {
    this.loadConversations();
  }

  private loadConversations(): void {
    this.conversations = this.conversationService.getConversations();
    
    // Create an initial conversation if none exists
    if (this.conversations.length === 0) {
      this.createNewChat();
    }
  }

  public createNewChat(): void {
    const newConversation = this.conversationService.createNewConversation();
    this.conversations = this.conversationService.getConversations();
    this.router.navigate(['/folder/inbox']);
  }

  public selectConversation(id: string): void {
    this.conversationService.setActiveConversation(id);
    this.router.navigate(['/folder/inbox']);
  }

  public startEditingTitle(conversation: ConversationSession): void {
    this.editingConversation = { ...conversation };
  }

  public saveTitle(id: string, title: any): void {
    // Convert input value to string to avoid type errors
    const titleString = title && title.toString ? title.toString().trim() : '';
    
    if (titleString) {
      this.conversationService.updateConversationTitle(id, titleString);
      this.editingConversation = null;
      this.conversations = this.conversationService.getConversations();
    }
  }

  public cancelEditing(): void {
    this.editingConversation = null;
  }

  public deleteConversation(id: string, event: Event): void {
    event.stopPropagation(); // Prevent navigation
    if (confirm('Are you sure you want to delete this conversation?')) {
      this.conversationService.deleteConversation(id);
      this.conversations = this.conversationService.getConversations();
    }
  }

  public formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

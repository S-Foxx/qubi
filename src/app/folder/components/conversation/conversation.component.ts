import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ConversationService } from '../../../services/conversation.service';
import { ConversationSession, ConversationMessage } from '../../../models/conversation-session.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ConversationComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  newMessage: string = '';
  messages: ConversationMessage[] = [];
  activeConversation: ConversationSession | null = null;
  private subscriptions = new Subscription();

  constructor(private conversationService: ConversationService) {}

  ngOnInit() {
    this.subscriptions.add(
      this.conversationService.activeConversation$.subscribe(conversation => {
        if (conversation) {
          this.activeConversation = conversation;
          this.messages = [...conversation.messages];
          setTimeout(() => this.scrollToBottom(), 100);
        } else {
          this.messages = [];
          this.activeConversation = null;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.activeConversation) return;

    // Add user message
    const userMessage: Omit<ConversationMessage, 'id'> = {
      text: this.newMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    this.conversationService.addMessage(this.activeConversation.id, userMessage);
    this.newMessage = '';
    
    // Simulate bot response (in a real app, this would call an API)
    setTimeout(() => {
      if (this.activeConversation) {
        const botMessage: Omit<ConversationMessage, 'id'> = {
          text: 'This is a simulated response from the bot.',
          sender: 'bot',
          timestamp: new Date()
        };
        this.conversationService.addMessage(this.activeConversation.id, botMessage);
      }
    }, 1000);
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}

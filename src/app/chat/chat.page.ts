import { Component, OnInit } from '@angular/core';
import { ConversationService } from '../services/conversation.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ConversationComponent } from './components/conversation/conversation.component';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ConversationComponent]
})
export class ChatPage implements OnInit {
  conversationId: string | null = null;

  constructor(private conversationService: ConversationService) {}

  ngOnInit() {
    // Subscribe to active conversation
    this.conversationService.activeConversation$.subscribe(conversation => {
      if (conversation) {
        this.conversationId = conversation.id;
      } else {
        this.conversationId = null;
      }
    });
    
    // Create a new conversation if none exists
    if (!this.conversationId) {
      this.createNewConversation();
    }
  }

  createNewConversation() {
    this.conversationService.createNewConversation();
  }
}
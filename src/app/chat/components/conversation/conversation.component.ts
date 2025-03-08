import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConversationService } from '../../../services/conversation.service';
import { ConversationSession } from '../../../models/conversation-session';
import { ConversationMessage } from '../../../models/conversation-message';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as webllm from "@mlc-ai/web-llm";

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ConversationComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('content', { static: false }) content: any;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  newMessage: string = '';
  messages: ConversationMessage[] = [];
  activeConversation: ConversationSession | null = null;
  currentDate: Date = new Date();
  private subscriptions = new Subscription();
  private engine: any = null;
  isGenerating: boolean = false;
  private shouldScrollToBottom: boolean = false;

  constructor(private conversationService: ConversationService) {}

  ngOnInit() {
    this.subscriptions.add(
      this.conversationService.activeConversation$.subscribe(conversation => {
        if (conversation) {
          this.activeConversation = conversation;
          this.messages = [...conversation.messages];
          this.shouldScrollToBottom = true;
        } else {
          this.messages = [];
          this.activeConversation = null;
        }
      })
    );

    this.getEngine();
    
    if (!this.activeConversation) {
      this.createNewConversation();
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private async getEngine() {
    try {
      // Wait for the AppComponent to initialize the engine
      // Check every 100ms for up to 30 seconds (300 attempts)
      let attempts = 0;
      const maxAttempts = 300;
      
      const waitForEngine = () => {
        return new Promise<any>((resolve, reject) => {
          const checkEngine = () => {
            if ((window as any).mlcEngine) {
              resolve((window as any).mlcEngine);
            } else if (attempts >= maxAttempts) {
              reject(new Error("Timed out waiting for MLC engine to initialize"));
            } else {
              attempts++;
              setTimeout(checkEngine, 100);
            }
          };
          checkEngine();
        });
      };
      
      // Wait for the engine to be initialized by AppComponent
      this.engine = await waitForEngine();
      console.log("ConversationComponent: Using MLC engine initialized by AppComponent");
    } catch (error) {
      console.error("Error getting MLC engine:", error);
    }
  }
  
  private createNewConversation() {
    this.conversationService.createNewConversation();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      if (this.newMessage.trim() && !this.isGenerating) {
        this.sendMessage();
      }
    }
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.activeConversation || this.isGenerating) return;

    const userMessage: Omit<ConversationMessage, 'id'> = {
      text: this.newMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    this.conversationService.addMessage(this.activeConversation.id, userMessage);
    const userInput = this.newMessage;
    this.newMessage = '';
    
    const botPlaceholder: Omit<ConversationMessage, 'id'> = {
      text: '',
      sender: 'bot',
      timestamp: new Date()
    };
    
    const botMessageId = this.conversationService.addMessage(this.activeConversation.id, botPlaceholder);
    this.shouldScrollToBottom = true;
    
    await this.generateLLMResponse(userInput, botMessageId);
  }

  private async generateLLMResponse(userInput: string, botMessageId: string) {
    if (!this.engine || !this.activeConversation) return;
    
    this.isGenerating = true;
    
    try {
      const chatHistory = this.prepareChatHistory();
      
      if (!chatHistory.some(msg => msg.role === 'system')) {
        chatHistory.unshift({
          role: 'system',
          content: 'You are a helpful AI assistant. You like to address yourself as Qubi when asked, but you are a Gemma model that you will honestly reveal if questioned directly. You do not use emojis. You do not use "*"s. You structure your responses in a human that sound human as you transition from one sentence to the next that flows inexorably to the next with ease. If anyone asks about the Qubi app, please ask them to be patient as development is still ongoing with more features planned. '
        });
      }
      
      chatHistory.push({
        role: 'user',
        content: userInput
      });
      
      let botResponse = '';
      
      try {
        if (this.hasStreamingSupport()) {
          await this.generateStreamingResponse(chatHistory, botMessageId);
        } else {
          botResponse = await this.engine.chat(userInput, {
            messages: chatHistory
          });
          this.updateBotMessage(botMessageId, botResponse);
        }
      } catch (error) {
        console.error('Error during response generation:', error);
        
        try {
          botResponse = await this.engine.chat(userInput, {
            messages: chatHistory
          });
          this.updateBotMessage(botMessageId, botResponse);
        } catch (chatError) {
          console.error('Error with fallback chat method:', chatError);
          this.updateBotMessage(botMessageId, 'Sorry, I encountered an error while generating a response.');
        }
      }
      
    } catch (error) {
      console.error('Error generating response:', error);
      this.updateBotMessage(botMessageId, 'Sorry, I encountered an error while generating a response.');
    } finally {
      this.isGenerating = false;
      this.shouldScrollToBottom = true;
    }
  }
  
  private hasStreamingSupport(): boolean {
    return (
      this.engine && 
      this.engine.chat && 
      typeof this.engine.chat === 'object' && 
      this.engine.chat.completions && 
      typeof this.engine.chat.completions.create === 'function'
    );
  }
  
  private async generateStreamingResponse(chatHistory: any[], botMessageId: string): Promise<void> {
    try {
      // Prepare request according to WebLLM specifications
      const request: any = {
        stream: true,
        stream_options: { include_usage: true },
        messages: chatHistory,
        logprobs: true,
        top_logprobs: 2,
      };
      
      // Get the streaming response generator
      const asyncChunkGenerator = await this.engine.chat.completions.create(request);
      
      // Initialize an empty message to build up incrementally
      let message = "";
      
      // Process each chunk as it arrives
      for await (const chunk of asyncChunkGenerator) {
        console.log(chunk);
        const deltaContent = chunk.choices[0]?.delta?.content || "";
        
        if (deltaContent) {
          message += deltaContent;
          this.updateBotMessage(botMessageId, message);
          
          // Scroll periodically as the message grows
          if (message.length % 50 === 0) {
            this.scrollToBottom();
          }
        }
        
        // Log usage statistics when they arrive (in the final chunk)
        if (chunk.usage) {
          console.log("Usage statistics:", chunk.usage);
        }
      }
      
      // Get the final concatenated message for verification
      console.log("Final message:", await this.engine.getMessage());
      
    } catch (error) {
      console.error("Error in streaming response:", error);
      this.updateBotMessage(botMessageId, "Sorry, I encountered an error while generating a response.");
    }
  }

  private prepareChatHistory() {
    if (!this.activeConversation) return [];
    
    const recentMessages = this.activeConversation.messages.slice(-10);
    
    return recentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  }
  
  private updateBotMessage(messageId: string, text: string) {
    if (!this.activeConversation) return;
    
    this.conversationService.updateMessage(this.activeConversation.id, messageId, text);
    this.shouldScrollToBottom = true;
  }

  private scrollToBottom() {
    if (this.content) {
      setTimeout(() => {
        this.content.scrollToBottom(300);
      }, 100);
    }
  }

  handleScrollStart() {
    // You can add additional logic here if needed
  }

  handleScroll(event: any) {
    // Optional: track scroll position if needed
  }

  handleScrollEnd() {
    // You can add additional logic here if needed
  }
}
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConversationService } from './services/conversation.service';
import { ConversationSession } from './models/conversation-session.model';
// Use type-only imports to avoid conflicts
import type { MLCEngineInterface } from '@mlc-ai/web-llm';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
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
  public folder: string = '';
  public loadingProgress: string = 'Loading...';
  public modelLoaded: boolean = false;
  private conversationService = inject(ConversationService);
  private router = inject(Router);
  private engine: MLCEngineInterface | null = null;
  private progressValue: number = 0;

  constructor() {}

  ngOnInit(): void {
    this.loadConversations();

    // Register service worker and load model
    this.registerServiceWorker();
  }

  /**
   * Register the service worker and load the model
   */
  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      try {
        // Use assets/sw.js instead of sw.ts
        navigator.serviceWorker.register('/assets/sw.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
            // Load model after service worker is registered
            this.loadModel();
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
            // If service worker registration fails, still try to load the model directly
            this.loadModel();
          });
      } catch (error) {
        console.error('Error during Service Worker registration:', error);
        // If service worker registration throws an error, still try to load the model directly
        this.loadModel();
      }
    } else {
      console.warn('Service workers are not supported in this browser');
      // If service workers aren't supported, load the model directly
      this.loadModel();
    }
  }

  private async loadModel(): Promise<void> {
    try {
      const modelName = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

      const initProgressCallback = (report: { text: string; progress: number }) => {
        this.loadingProgress = `Loading: ${report.text} (${(report.progress * 100).toFixed(0)}%)`;
        this.progressValue = report.progress;
        console.log(this.loadingProgress);
      };

      // Try to use service worker if available, otherwise fall back to regular engine
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        console.log('Using service worker for model loading');
        try {
          // Dynamic import to avoid TypeScript conflicts
          const webLLM = await import('@mlc-ai/web-llm');
          
          // Properly await the engine creation
          this.engine = await webLLM.CreateServiceWorkerMLCEngine(
            modelName,
            { initProgressCallback }
          );
        } catch (swError) {
          console.error('Error creating service worker engine:', swError);
          console.log('Falling back to regular engine');
          // Fall back to regular engine if service worker fails
          this.loadingProgress = 'Service worker failed, falling back to regular engine...';
          
          // Import the regular engine creator
          const webLLM = await import('@mlc-ai/web-llm');
          this.engine = await webLLM.CreateMLCEngine(
            modelName,
            { initProgressCallback }
          );
        }
      } else {
        console.log('No active service worker, using regular engine');
        // Import the regular engine creator
        const webLLM = await import('@mlc-ai/web-llm');
        this.engine = await webLLM.CreateMLCEngine(
          modelName,
          { initProgressCallback }
        );
      }

      this.modelLoaded = true;
      this.loadingProgress = 'Model Loaded!';
      this.progressValue = 1;
      console.log('Model Loaded!');
    } catch (error) {
      console.error('Error loading model:', error);
      this.loadingProgress = `Error loading model: ${error}`;
    }
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

  // Method to get the progress value for the progress bar
  public getProgressValue(): number {
    return this.progressValue;
  }
}

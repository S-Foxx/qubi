import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import * as MlcSw from '../sw'
import { filter } from 'rxjs/operators';
import * as webllm from '@mlc-ai/web-llm';
import { DevToolbarComponent } from './components/dev-toolbar/dev-toolbar.component';

interface AppPage {
  title: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, RouterLinkActive, DevToolbarComponent]
})
export class AppComponent implements OnInit {
  public appPages: AppPage[] = [
    { title: 'Chat', url: '/chat', icon: 'chatbubbles' },
    { title: 'Settings', url: '/folder/settings', icon: 'settings' },
    { title: 'About', url: '/folder/about', icon: 'information-circle' }
  ];
  
  modelLoaded: boolean = false;
  loadingProgress: string = 'Initializing...';
  progressValue: number = 0;
  
  constructor(private swUpdate: SwUpdate) {}
  
  ngOnInit() {
    // First set up service workers
    this.setupServiceWorker();
    
    // Initialize WebLLM after service workers are initialized
    setTimeout(() => {
      this.initializeWebLLM();
    }, 1000);
    
    // Check for updates
    this.checkForUpdates();
  }
  
  getProgressValue(): number {
    return this.progressValue;
  }
  
  private async initializeWebLLM() {
    try {
      let engine;
      const modelId = "gemma-2-2b-it-q4f32_1-MLC";
      const workerOptions = {
        initProgressCallback: (report: { text: string; progress: number }) => {
          this.loadingProgress = report.text;
          this.progressValue = report.progress;
          console.log(`WebLLM init progress: ${this.progressValue.toFixed(2)}% - ${this.loadingProgress}`);
        },
        // Add cache settings to prevent duplicate downloads
        cachePaths: {
          // Use memory cache for WebLLM models to avoid duplicate downloads
          "model": "memory",
          "weights": "memory" 
        }
      };
      
      // Check if we have a registered service worker
      const hasServiceWorker = (window as any).swRegistration && 
                               (window as any).swRegistration.active;
      
      // First try with service worker if available
      if (hasServiceWorker) {
        try {
          console.log("Attempting to initialize WebLLM with service worker");
          engine = await webllm.CreateServiceWorkerMLCEngine(modelId, workerOptions);
          console.log("Successfully initialized WebLLM with service worker");
        } catch (swError) {
          console.warn("Service worker initialization failed, falling back to standard WebLLM:", swError);
          engine = null;
        }
      } else {
        console.log("No active service worker, using standard WebLLM");
      }
      
      // Fall back to standard WebLLM if service worker approach failed
      if (!engine) {
        try {
          console.log(`Initializing standard WebLLM with model: ${modelId}`);
          engine = await webllm.CreateMLCEngine(modelId, workerOptions);
          console.log("Successfully initialized WebLLM without service worker");
        } catch (error) {
          console.error("Failed to initialize standard WebLLM:", error);
          throw error;
        }
      }
      
      // Store the engine in window for global access
      (window as any).mlcEngine = engine;
      
      this.modelLoaded = true;
      console.log('WebLLM initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebLLM:', error);
      this.loadingProgress = "Failed to load model. Please refresh the page.";
    }
  }

  private async setupServiceWorker() {
    // First register the Angular service worker (ngsw) which is configured automatically
    if (this.swUpdate.isEnabled) {
      console.log("Angular service worker is enabled");
    }
    
    // Then try to register our custom service worker for WebLLM
    await this.registerCustomServiceWorker();
  }

  private async registerCustomServiceWorker(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers are not supported by this browser");
      return false;
    }
    
    try {
      // Use a simple service worker at the root path for maximum compatibility
      const swUrl = `${window.location.origin}/sw.js`;
      console.log(`Registering service worker from: ${swUrl}`);
      
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/'
      });
      
      let message = "Unknown service worker state";
      if (registration.installing) {
        message = "Service worker is installing";
      } else if (registration.waiting) {
        message = "Service worker is installed and waiting";
      } else if (registration.active) {
        message = "Service worker is active";
      }
      
      console.log(message);
      console.log("Service worker registration successful");
      
      // Store the registration for future use
      (window as any).swRegistration = registration;
      return true;
    } catch (error) {
      console.error("Service worker registration failed:", error);
      
      // Log helpful debugging information
      if (window.location.protocol === 'file:') {
        console.error("Service workers cannot run with file:// protocol. Use a web server.");
      } else if (window.location.hostname !== 'localhost' && !window.location.protocol.includes('https')) {
        console.error("Service workers require HTTPS unless on localhost.");
      }
      
      return false;
    }
  }

  private checkForUpdates(): void {
    if (this.swUpdate.isEnabled) {
      // Allow the app to stabilize first, then check for updates
      setTimeout(() => {
        this.swUpdate.checkForUpdate().then(() => console.log('Check for updates completed'));
      }, 10000);
      
      // Subscribe to version updates
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(evt => {
          console.log(`Current app version: ${evt.currentVersion.hash}`);
          console.log(`New app version ready for use: ${evt.latestVersion.hash}`);
          
          // Reload the page to update to the latest version
          window.location.reload();
        });
    }
  }
}
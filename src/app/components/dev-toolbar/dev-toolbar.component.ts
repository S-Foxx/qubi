import { Component } from '@angular/core';
import { UpdateService } from '../../services/update.service';
import { environment } from '../../../environments/environment';
import { ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-dev-toolbar',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-fab vertical="bottom" horizontal="end" slot="fixed" *ngIf="showDevTools">
      <ion-fab-button color="dark" size="small">
        <ion-icon name="construct-outline"></ion-icon>
      </ion-fab-button>
      <ion-fab-list side="top">
        <ion-fab-button color="light" (click)="clearCache()">
          <ion-icon name="refresh-outline"></ion-icon>
        </ion-fab-button>
        <ion-fab-button color="light" (click)="checkForUpdates()">
          <ion-icon name="sync-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab-list>
    </ion-fab>
  `,
  styles: [`
    ion-fab {
      z-index: 9999;
    }
  `]
})
export class DevToolbarComponent {
  // Only show in development mode
  showDevTools = !environment.production;

  constructor(
    private updateService: UpdateService,
    private toastCtrl: ToastController
  ) {}

  // Force check for updates - useful when working with SCSS changes
  async checkForUpdates(): Promise<void> {
    try {
      const hasUpdate = await this.updateService.checkForUpdates();
      const toast = await this.toastCtrl.create({
        message: hasUpdate ? 'Updates available. Refreshing...' : 'No updates found',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
      
      if (hasUpdate) {
        setTimeout(() => {
          this.updateService.updateApplication();
        }, 2000);
      }
    } catch (err) {
      console.error('Error checking for updates:', err);
    }
  }

  // Clear browser cache - useful for SCSS development
  async clearCache(): Promise<void> {
    try {
      // Attempt to clear the cache through the Cache API
      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => window.caches.delete(cacheName))
        );
      }
      
      // Show toast
      const toast = await this.toastCtrl.create({
        message: 'Cache cleared. Refreshing page...',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }
}

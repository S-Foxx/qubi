import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  constructor(
    private swUpdate: SwUpdate,
    private toastCtrl: ToastController
  ) {
    // Only set up manual update handling
    this.setupUpdateHandling();
  }

  private setupUpdateHandling(): void {
    if (this.swUpdate.isEnabled) {
      // Handle available updates when manually checked
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(async (event) => {
          console.log('Current version:', event.currentVersion);
          console.log('Available version:', event.latestVersion);
          
          // Notify the user and prompt to refresh
          const toast = await this.toastCtrl.create({
            message: 'A new version is available. Refresh to update?',
            position: 'bottom',
            buttons: [
              {
                text: 'Refresh',
                role: 'confirm',
                handler: () => {
                  window.location.reload();
                }
              },
              {
                text: 'Later',
                role: 'cancel'
              }
            ],
            duration: 10000
          });
          await toast.present();
        });

      // Handle installation errors
      this.swUpdate.unrecoverable.subscribe(async (event) => {
        console.error('SW unrecoverable error:', event.reason);
        
        const toast = await this.toastCtrl.create({
          message: 'An error occurred. Please reload the application.',
          position: 'bottom',
          buttons: [
            {
              text: 'Reload',
              role: 'confirm',
              handler: () => {
                window.location.reload();
              }
            }
          ],
          duration: 0 // Don't auto-dismiss
        });
        await toast.present();
      });
    }
  }

  // Force check for updates - can be called from components
  checkForUpdates(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return Promise.resolve(false);
    }
    return this.swUpdate.checkForUpdate();
  }

  // Force update application - can be called from components
  updateApplication(): void {
    if (this.swUpdate.isEnabled) {
      window.location.reload();
    }
  }
}

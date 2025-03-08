import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ServiceWorkerModule } from '@angular/service-worker';

import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';
import { environment } from './environments/environment';
import { UpdateService } from './app/services/update.service';

// Enable production mode if needed
if (environment.production) {
  enableProdMode();
}

// Bootstrap the standalone AppComponent with providers
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    UpdateService,
    importProvidersFrom(
      IonicModule.forRoot(),
      AppRoutingModule,
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: environment.production || !environment.production,
        registrationStrategy: 'registerWhenStable:30000'
      })
    )
  ]
}).catch(err => console.error('Error bootstrapping app:', err));

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { UpdateService } from './services/update.service';

@NgModule({
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule,
    AppComponent, 
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production || !environment.production, 
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    UpdateService 
  ],
  bootstrap: []
})
export class AppModule {
  constructor(private updateService: UpdateService) {
    // Service is automatically initialized
  }
}

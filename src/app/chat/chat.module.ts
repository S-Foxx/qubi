import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ChatPageRoutingModule } from './chat-routing.module';
import { ChatPage } from './chat.page';
import { ConversationComponent } from './components/conversation/conversation.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ChatPageRoutingModule,
    // Import standalone components instead of declaring them
    ChatPage,
    ConversationComponent
  ],
  declarations: [] // No declarations for standalone components
})
export class ChatPageModule {}
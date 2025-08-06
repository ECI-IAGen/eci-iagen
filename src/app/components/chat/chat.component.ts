import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Client, Frame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'processing' | 'streaming' | 'completed' | 'error';
  complete?: boolean;
}

interface ChatMessageRequest {
  message: string;
  sessionId: string;
  userRole: string;
}

interface ChatMessageResponse {
  message: string;
  status: string;
  complete?: boolean;
  sessionId?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  private stompClient: Client | null = null;
  private sessionId: string = '';

  messages: ChatMessage[] = [];
  currentMessage: string = '';
  isSending: boolean = false;
  userRole: string = 'coordinador';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    console.log('ChatComponent ngOnInit started');
    
    // Only initialize in browser environment
    if (this.isBrowser) {
      this.sessionId = this.generateSessionId();
      this.initializeWebSocket();
      
      // Debug: Log initial state
      console.log('ChatComponent initialized', {
        currentMessage: this.currentMessage,
        isSending: this.isSending,
        sessionId: this.sessionId
      });

      // Test method availability
      console.log('Methods available:', {
        sendMessage: typeof this.sendMessage,
        debugButtonState: typeof this.debugButtonState
      });
    } else {
      console.log('ChatComponent: Not in browser environment, skipping initialization');
    }
  }

  ngOnDestroy() {
    console.log('ChatComponent destroying...');
    
    if (this.stompClient) {
      try {
        if (this.stompClient.connected) {
          console.log('Deactivating WebSocket connection...');
          //this.stompClient.deactivate();
        }
      } catch (error) {
        console.error('Error during WebSocket deactivation:', error);
      } finally {
        //this.stompClient = null;
      }
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private initializeWebSocket() {
    // Only initialize WebSocket in browser
    if (!this.isBrowser) {
      console.log('WebSocket initialization skipped - not in browser');
      return;
    }

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame: Frame) => {
      console.log('Connected to WebSocket:', frame);
      
      // Verificar que stompClient no sea null antes de usar subscribe
      if (this.stompClient && this.stompClient.connected) {
        const topicPath = `/topic/chat/${this.sessionId}`;
        console.log('Subscribing to:', topicPath);
        
        try {
          this.stompClient.subscribe(topicPath, (message: any) => {
            try {
              const response: ChatMessageResponse = JSON.parse(message.body);
              this.handleBotMessage(response);
            } catch (error) {
              console.error('Error parsing message:', error);
            }
          });
        } catch (error) {
          console.error('Error subscribing to topic:', error);
        }
      } else {
        console.error('StompClient is null or not connected when trying to subscribe');
      }
    };

    this.stompClient.onStompError = (frame: Frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.stompClient.onWebSocketError = (event: Event) => {
      console.error('WebSocket error:', event);
    };

    this.stompClient.onDisconnect = (frame: Frame) => {
      console.log('Disconnected from WebSocket:', frame);
    };

    try {
      this.stompClient.activate();
    } catch (error) {
      console.error('Error activating WebSocket client:', error);
    }
  }

  async sendMessage() {
    console.log('sendMessage called!', {
      currentMessage: this.currentMessage,
      isSending: this.isSending,
      isBrowser: this.isBrowser
    });

    if (!this.isBrowser) {
      console.log('sendMessage: Not in browser, skipping');
      return;
    }

    if (!this.currentMessage.trim() || this.isSending) {
      console.log('sendMessage: Invalid state', {
        hasMessage: !!this.currentMessage.trim(),
        isSending: this.isSending
      });
      return;
    }

    const messageText = this.currentMessage.trim();
    this.currentMessage = '';
    this.isSending = true;

    // Agregar mensaje del usuario a la interfaz
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      message: messageText,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    this.messages.push(userMessage);

    // Enviar mensaje via WebSocket
    const request: ChatMessageRequest = {
      message: messageText,
      sessionId: this.sessionId,
      userRole: this.userRole
    };

    try {
      if (this.stompClient?.connected) {
        this.stompClient.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify(request),
          headers: { 'content-type': 'application/json' }
        });
        userMessage.status = 'sent';
        console.log('Message sent successfully');
      } else {
        throw new Error('WebSocket not connected');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      userMessage.status = 'error';
      
      // Mostrar mensaje de error al usuario
      const errorMessage: ChatMessage = {
        id: this.generateMessageId(),
        message: `Error al enviar el mensaje. Verifica que el backend WebSocket esté ejecutándose en localhost:8080/ws. Error: ${error}`,
        sender: 'bot',
        timestamp: new Date(),
        status: 'completed'
      };
      this.messages.push(errorMessage);
    } finally {
      this.isSending = false;
    }
  }

  private handleBotMessage(response: ChatMessageResponse) {
    console.log('Received bot message:', response);

    // Crear mensaje del bot directamente
    const botMessage: ChatMessage = {
      id: this.generateMessageId(),
      message: response.message,
      sender: 'bot',
      timestamp: new Date(),
      status: 'completed',
      complete: true
    };
    
    this.messages.push(botMessage);
  }

  private generateMessageId(): string {
    return 'msg_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    } catch (err) {}
  }

  formatMessage(message: string): string {
    // Convertir saltos de línea a <br>
    return message.replace(/\n/g, '<br>');
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  // Expose methods to window for onclick access
  ngAfterViewInit() {
    if (this.isBrowser) {
      console.log('ngAfterViewInit: Setting up component');
      (window as any).chatComponent = {
        sendMessage: () => this.sendMessage(),
        debugButtonState: () => this.debugButtonState()
      };
    }
  }

  // Keep debug method for console testing
  debugButtonState() {
    console.log('Button state debug:', {
      currentMessage: this.currentMessage,
      trimmed: this.currentMessage?.trim(),
      length: this.currentMessage?.length,
      isSending: this.isSending,
      isDisabled: !this.currentMessage?.trim() || this.isSending
    });
  }

  // Simple test method
  testSimpleClick() {
    console.log('testSimpleClick called!');
    alert('Angular (click) está funcionando!');
  }
}
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Client } from '@stomp/stompjs';
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
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  private stompClient: Client | null = null;
  private sessionId: string = '';

  messages: ChatMessage[] = [];
  currentMessage: string = '';
  isSending: boolean = false;
  userRole: string = 'coordinador';

  constructor() {}

  ngOnInit() {
    this.sessionId = this.generateSessionId();
    this.initializeWebSocket();
  }

  ngOnDestroy() {
    if (this.stompClient) {
      if (this.stompClient.connected) {
        this.stompClient.deactivate();
      }
      this.stompClient = null;
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private initializeWebSocket() {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      const topicPath = `/topic/chat/${this.sessionId}`;
      this.stompClient!.subscribe(topicPath, (message: any) => {
        try {
          const response: ChatMessageResponse = JSON.parse(message.body);
          this.handleBotMessage(response);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
    };

    this.stompClient.activate();
  }

  async sendMessage() {
    if (!this.currentMessage.trim() || this.isSending) {
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
      } else {
        throw new Error('WebSocket not connected');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      userMessage.status = 'error';
      
      // Mostrar mensaje de error al usuario
      const errorMessage: ChatMessage = {
        id: this.generateMessageId(),
        message: `Error al enviar el mensaje. Verifica que el backend WebSocket esté ejecutándose en localhost:8080/ws`,
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
}
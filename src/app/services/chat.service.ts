import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'processing' | 'streaming' | 'completed' | 'error';
  complete?: boolean;
}

export interface ChatMessageRequest {
  message: string;
  sessionId: string;
  userRole: string;
}

export interface ChatMessageResponse {
  message: string;
  status: string;
  complete?: boolean;
  sessionId?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private stompClient: Client | null = null;
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>('disconnected');
  private messagesSubject = new BehaviorSubject<ChatMessageResponse[]>([]);
  
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();

  private sessionId: string = '';

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  getSessionId(): string {
    return this.sessionId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.stompClient && this.stompClient.connected) {
        resolve();
        return;
      }

      this.connectionStatusSubject.next('connecting');
      console.log('ChatService: Connecting to WebSocket...');

      this.stompClient = new Client({
        webSocketFactory: () => {
          const socket = new SockJS('http://localhost:8080/ws');
          console.log('ChatService: Creating SockJS connection...');
          return socket;
        },
        connectHeaders: {},
        debug: (str) => {
          console.log('ChatService STOMP Debug: ' + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.stompClient.onConnect = (frame) => {
        console.log('ChatService: Connected successfully');
        this.connectionStatusSubject.next('connected');

        // Suscribirse al topic específico de la sesión
        this.stompClient!.subscribe(`/topic/chat/${this.sessionId}`, (message) => {
          console.log('ChatService: Received message:', message.body);
          const response: ChatMessageResponse = JSON.parse(message.body);
          this.handleIncomingMessage(response);
        });

        console.log('ChatService: Subscribed to topic:', `/topic/chat/${this.sessionId}`);
        resolve();
      };

      this.stompClient.onStompError = (frame) => {
        console.error('ChatService: Broker reported error:', frame.headers['message']);
        console.error('ChatService: Additional details:', frame.body);
        this.connectionStatusSubject.next('error');
        reject(new Error(frame.headers['message']));
      };

      this.stompClient.onWebSocketClose = (event) => {
        console.log('ChatService: WebSocket connection closed');
        if (this.connectionStatusSubject.value === 'connected') {
          this.connectionStatusSubject.next('disconnected');
        }
      };

      this.stompClient.onWebSocketError = (event) => {
        console.error('ChatService: WebSocket error:', event);
        this.connectionStatusSubject.next('error');
        reject(new Error('WebSocket connection error'));
      };

      this.stompClient.onDisconnect = (frame) => {
        console.log('ChatService: Disconnected');
        this.connectionStatusSubject.next('disconnected');
      };

      try {
        this.stompClient.activate();
        console.log('ChatService: STOMP client activated');
      } catch (error) {
        console.error('ChatService: Error activating STOMP client:', error);
        this.connectionStatusSubject.next('error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      console.log('ChatService: Disconnecting...');
      this.stompClient.deactivate();
    }
    this.connectionStatusSubject.next('disconnected');
  }

  sendMessage(message: string, userRole: string = 'coordinador'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.stompClient || !this.stompClient.connected) {
        reject(new Error('Not connected to WebSocket'));
        return;
      }

      const request: ChatMessageRequest = {
        message: message,
        sessionId: this.sessionId,
        userRole: userRole
      };

      try {
        console.log('ChatService: Publishing message:', request);
        this.stompClient.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify(request)
        });
        resolve();
      } catch (error) {
        console.error('ChatService: Error sending message:', error);
        reject(error);
      }
    });
  }

  private handleIncomingMessage(response: ChatMessageResponse): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, response]);
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatusSubject.value;
  }

  isConnected(): boolean {
    return this.connectionStatusSubject.value === 'connected';
  }

  clearMessages(): void {
    this.messagesSubject.next([]);
  }
}

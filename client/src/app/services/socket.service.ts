import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  // In Docker/Nginx, /socket.io is proxied to backend.
  private readonly URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';

  constructor(private authService: AuthService) {
    const token = this.authService.getAccessToken();
    this.socket = io(this.URL, {
      withCredentials: true,
      autoConnect: false,
      auth: token ? { token } : {},
      query: token ? { token } : {},
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
  }

  connect() {
    if (!this.socket.connected) {
      const token = this.authService.getAccessToken();
      if (token) {
        this.socket.auth = { token };
      }
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  // Reconnection logic with state sync
  onReconnect(callback: () => void) {
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      callback();
    });
  }

  onDisconnect(callback: () => void) {
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      callback();
    });
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  listen<T>(eventName: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.socket.on(eventName, (data: T) => {
        subscriber.next(data);
      });

      return () => {
        this.socket.off(eventName);
      };
    });
  }
}

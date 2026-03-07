import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  // In Docker/Nginx, /socket.io is proxied to backend. 
  // If we leave URL empty, it uses window.location derived path.
  // But our Nginx listens on 4200 (mapped to 80).
  private readonly URL = 'http://localhost:4200';

  constructor() {
    // Get token from localStorage (avoiding circular dependency)
    const token = localStorage.getItem('accessToken');
    
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

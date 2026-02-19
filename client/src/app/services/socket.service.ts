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
    this.socket = io(this.URL, {
      withCredentials: true,
      autoConnect: false
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

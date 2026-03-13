import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SoldData {
  playerName: string;
  teamName: string;
  soldPrice: number;
  playerImageUrl?: string | null;
  category?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SoldCelebrationService {
  private soldSubject = new BehaviorSubject<SoldData | null>(null);
  sold$ = this.soldSubject.asObservable();

  constructor() {}

  triggerSold(data: SoldData): void {
    this.soldSubject.next(data);
  }

  playGavelSound(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 400;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  dismiss(): void {
    this.soldSubject.next(null);
  }
}

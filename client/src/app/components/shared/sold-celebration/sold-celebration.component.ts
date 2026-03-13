import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SoldCelebrationService, SoldData } from '../../../services/sold-celebration.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sold-celebration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sold-celebration.component.html',
  styleUrl: './sold-celebration.component.css'
})
export class SoldCelebrationComponent implements OnInit, OnDestroy {
  private soldService = inject(SoldCelebrationService);
  private sub?: Subscription;

  visible = false;
  phase: 'going-once' | 'going-twice' | 'countdown' | 'sold' | 'result' = 'going-once';
  countdownNum = 3;
  data: SoldData | null = null;
  private phaseTimer: any;

  ngOnInit() {
    this.sub = this.soldService.sold$.subscribe((d) => {
      if (d) {
        this.data = d;
        this.startSequence();
      } else {
        this.visible = false;
        this.clearPhaseTimer();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.clearPhaseTimer();
  }

  private clearPhaseTimer() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  private startSequence() {
    this.visible = true;
    this.phase = 'going-once';
    this.clearPhaseTimer();

    this.phaseTimer = setTimeout(() => {
      this.phase = 'going-twice';
      this.phaseTimer = setTimeout(() => {
        this.phase = 'countdown';
        this.countdownNum = 3;
        this.runCountdown();
      }, 600);
    }, 600);
  }

  private runCountdown() {
    if (this.countdownNum > 0) {
      this.phaseTimer = setTimeout(() => {
        this.countdownNum--;
        if (this.countdownNum > 0) {
          this.runCountdown();
        } else {
          this.phase = 'sold';
          this.soldService.playGavelSound();
          this.phaseTimer = setTimeout(() => {
            this.phase = 'result';
            this.phaseTimer = setTimeout(() => {
              this.soldService.dismiss();
            }, 5000);
          }, 800);
        }
      }, 500);
    }
  }

  dismiss() {
    this.soldService.dismiss();
  }

  getPlayerImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return url.startsWith('/') ? `${base}${url}` : `${base}/api/uploads/${url}`;
  }
}

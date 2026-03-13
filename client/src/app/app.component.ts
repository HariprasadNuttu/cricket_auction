import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SoldCelebrationComponent } from './components/shared/sold-celebration/sold-celebration.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SoldCelebrationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'client';
}

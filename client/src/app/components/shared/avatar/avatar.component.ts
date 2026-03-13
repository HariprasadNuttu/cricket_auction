import { Component, Input, inject, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../../services/image.service';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css'
})
export class AvatarComponent implements OnInit, OnChanges {
  private imageService = inject(ImageService);

  @Input() imageUrl: string | null | undefined;
  @Input() name = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showPreviewOnHover = false;

  resolvedUrl = '';
  showPlaceholder = true;

  ngOnInit() {
    this.updateImage();
  }

  ngOnChanges() {
    this.updateImage();
  }

  private updateImage() {
    const url = this.imageService.getImageUrl(this.imageUrl);
    this.resolvedUrl = url;
    this.showPlaceholder = !url;
  }

  onError() {
    this.showPlaceholder = true;
  }
}

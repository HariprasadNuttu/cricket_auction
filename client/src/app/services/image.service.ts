import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageService {
  /**
   * Resolve image URL for display. Handles relative paths, absolute URLs.
   */
  getImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return url.startsWith('/') ? `${base}${url}` : `${base}/api/uploads/${url}`;
  }
}

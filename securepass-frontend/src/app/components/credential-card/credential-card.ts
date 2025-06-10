// credential-card.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-credential-card',
  standalone: true,
  templateUrl: './credential-card.html',
  styleUrls: ['./credential-card.css'],
  imports: [CommonModule]
})
export class CredentialCardComponent {
  @Input() credential: any;
  @Output() onDelete = new EventEmitter<number>();
  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  copyToClipboard(value: string, type: string) {
    navigator.clipboard.writeText(value).then(() => {
      this.showNotification(`${type} copied to clipboard!`, 'success');
    }).catch(() => {
      this.showNotification(`Failed to copy ${type.toLowerCase()}`, 'error');
    });
  }

  getSiteFavicon(): string {
    const site = this.credential.site.toLowerCase();
    if (site.includes('github')) return 'G';
    if (site.includes('google') || site.includes('gmail')) return 'G';
    if (site.includes('facebook')) return 'F';
    if (site.includes('twitter')) return 'T';
    if (site.includes('linkedin')) return 'L';
    if (site.includes('instagram')) return 'I';
    if (site.includes('netflix')) return 'N';
    if (site.includes('amazon')) return 'A';
    if (site.includes('reddit')) return 'R';
    if (site.includes('stackoverflow')) return 'S';
    if (site.includes('leetcode')) return 'L';
    return this.credential.site.charAt(0).toUpperCase();
  }

  getFaviconColor(): string {
    const site = this.credential.site.toLowerCase();
    if (site.includes('github')) return 'linear-gradient(135deg, #333, #24292e)';
    if (site.includes('google') || site.includes('gmail')) return 'linear-gradient(135deg, #ea4335, #fbbc05)';
    if (site.includes('facebook')) return 'linear-gradient(135deg, #1877f2, #42a5f5)';
    if (site.includes('twitter')) return 'linear-gradient(135deg, #1da1f2, #0d8bd9)';
    if (site.includes('linkedin')) return 'linear-gradient(135deg, #0077b5, #00a0dc)';
    if (site.includes('instagram')) return 'linear-gradient(135deg, #e1306c, #fd1d1d)';
    if (site.includes('netflix')) return 'linear-gradient(135deg, #e50914, #f40612)';
    if (site.includes('amazon')) return 'linear-gradient(135deg, #ff9500, #ff6600)';
    if (site.includes('reddit')) return 'linear-gradient(135deg, #ff4500, #ff6b35)';
    if (site.includes('stackoverflow')) return 'linear-gradient(135deg, #f48024, #f69030)';
    if (site.includes('leetcode')) return 'linear-gradient(135deg, #4CAF50, #45a049)';
    return 'linear-gradient(135deg, #667eea, #764ba2)';
  }

  getUserIcon(): string {
    const username = this.credential.username.toLowerCase();
    if (username.includes('@') || this.credential.site.includes('gmail')) return '✉️';
    if (this.credential.site.includes('shopping') || this.credential.site.includes('amazon')) return '🛒';
    if (this.credential.site.includes('photo') || this.credential.site.includes('instagram')) return '📸';
    if (this.credential.site.includes('professional') || this.credential.site.includes('linkedin')) return '💼';
    if (this.credential.site.includes('code') || this.credential.site.includes('github')) return '💻';
    if (this.credential.site.includes('movie') || this.credential.site.includes('netflix')) return '🎬';
    return '👤';
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    // Simple notification - could be enhanced with a proper toast service
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}
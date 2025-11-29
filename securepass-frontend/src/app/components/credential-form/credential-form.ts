// src/app/components/credential-form/credential-form.ts
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-credential-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './credential-form.html',
  styleUrls: ['./credential-form.css'],
})
export class CredentialFormComponent implements OnChanges, AfterViewInit {
  @Input() editCredential: any | null = null;

  @Output() onAdd = new EventEmitter<any>();
  @Output() onUpdate = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();

  @ViewChild('siteInput') siteInput!: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;

  site = '';
  username = '';
  password = '';

  showPassword = false;
  generatedPassword = '';
  submitting = false;
  passwordA11yLabel = 'Password strength: unknown';

  ngAfterViewInit(): void {
    // avoid throwing errors if ViewChild not available yet
    try {
      if (this.siteInput?.nativeElement) {
        // focus the site input on initial render
        this.siteInput.nativeElement.focus();
      }
    } catch (err) {
      // Focus error - non-critical, ignore
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editCredential']) {
      if (this.editCredential) {
        // Edit mode: populate site/username (readonly), clear password
        this.site = this.editCredential.site ?? '';
        this.username = this.editCredential.username ?? '';
        this.password = '';
        this.generatedPassword = '';
        this.showPassword = false;
        // Focus password field in edit mode since site/username are readonly
        setTimeout(() => {
          try { this.passwordInput?.nativeElement?.focus?.(); } catch {}
        }, 0);
      } else {
        // Add mode: clear all fields
        this.resetForm();
        // Focus site field in add mode
        setTimeout(() => {
          try { this.siteInput?.nativeElement?.focus?.(); } catch {}
        }, 0);
      }
      this.updatePasswordA11y();
    }
  }

  private resetForm(): void {
    this.site = '';
    this.username = '';
    this.password = '';
    this.generatedPassword = '';
    this.showPassword = false;
  }

  focusPassword() {
    try { this.passwordInput?.nativeElement?.focus?.(); } catch {}
  }

  onSubmit(form: NgForm) {
    if (!form.valid) return;

    // In edit mode, password is optional - only include it if provided
    const effectivePwd = this.password || this.generatedPassword;
    
    this.submitting = true;

    if (this.editCredential) {
      // Edit mode: use original site/username (they're readonly), only update password if provided
      const payload: any = { 
        id: this.editCredential.id, 
        site: this.editCredential.site, // Use original, not the form value (even though they should match)
        username: this.editCredential.username // Use original, not the form value
      };
      // Only include password if user provided a new one
      if (effectivePwd) {
        payload.password = effectivePwd;
      }
      this.onUpdate.emit(payload);
    } else {
      // Add mode: use form values
      const payload = { 
        site: this.site, 
        username: this.username, 
        password: effectivePwd 
      };
      this.onAdd.emit(payload);
    }

    setTimeout(() => {
      this.submitting = false;
      if (!this.editCredential) {
        this.resetForm();
        form.resetForm();
      }
    }, 800);
  }

  cancel() { this.onCancel.emit(); }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
    if (this.showPassword) setTimeout(() => this.focusPassword(), 0);
  }

  passwordScore(pwd: string): number {
    if (!pwd) return 0;
    let score = Math.min(40, Math.max(0, pwd.length * 4));
    const variations = [
      /\d/.test(pwd),
      /[a-z]/.test(pwd),
      /[A-Z]/.test(pwd),
      /[^0-9a-zA-Z]/.test(pwd)
    ].filter(Boolean).length;
    score += (variations - 1) * 15;
    return Math.min(100, score);
  }

  passwordStrengthLabel(pwd: string): string {
    const score = this.passwordScore(pwd);
    if (score >= 80) return 'Strong';
    if (score >= 50) return 'Medium';
    if (score > 0) return 'Weak';
    return 'Empty';
  }

  updatePasswordA11y() {
    this.passwordA11yLabel = `Password strength: ${this.passwordStrengthLabel(this.password || this.generatedPassword)}`;
  }

  onPasswordInput() { this.updatePasswordA11y(); }

  generatePassword(length = 16) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}<>?';
    let out = '';
    const rnd = (window.crypto && (window.crypto as any).getRandomValues) ? (window.crypto as any).getRandomValues(new Uint32Array(length)) : null;
    for (let i = 0; i < length; i++) {
      if (rnd) out += chars[rnd[i] % chars.length];
      else out += chars[Math.floor(Math.random() * chars.length)];
    }
    this.generatedPassword = out;
    this.password = out;
    this.updatePasswordA11y();
    setTimeout(() => this.focusPassword(), 0);
  }

  async copyPassword() {
    const val = this.password || this.generatedPassword || '';
    if (!val) return;
    try { 
      await navigator.clipboard.writeText(val);
      // Could emit an event here if we want to show toast from form
    } catch (err) {
      // Clipboard copy failed - non-critical, ignore
    }
  }

  effectivePassword(): string { return this.password || this.generatedPassword || ''; }
}

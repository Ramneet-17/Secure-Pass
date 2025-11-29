import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isStrongPassword } from '../../utils/password.util';

@Component({
  selector: 'app-credential-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credential-card.html',
  styleUrls: ['./credential-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CredentialCardComponent {
  @Input() credential: any;
  @Output() onDelete = new EventEmitter<number>();
  @Output() onEdit = new EventEmitter<number>();
  @Output() onCopy = new EventEmitter<{ field: string; value: string; id: number }>();
  @Output() onToggle = new EventEmitter<{ id: number; shown: boolean }>();

  showPassword = false;

  masked(pwd?: string) {
    if (!pwd) return '••••••••';
    return '•'.repeat(Math.max(8, Math.min(12, pwd.length)));
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.onToggle.emit({ id: this.credential?.id, shown: this.showPassword });
  }

  isPasswordStrong(p?: string): boolean {
    return isStrongPassword(p);
  }

  async copyPassword() {
    const val = this.credential?.password ?? '';
    const id = this.credential?.id ?? 0;
    if (!val) {
      this.onCopy.emit({ field: 'password', value: '', id });
      return;
    }
    try {
      await navigator.clipboard?.writeText(val);
      this.onCopy.emit({ field: 'password', value: val, id });
    } catch (err) {
      this.onCopy.emit({ field: 'password', value: '', id });
    }
  }

  async copyUsername() {
    const val = this.credential?.username ?? '';
    const id = this.credential?.id ?? 0;
    if (!val) {
      this.onCopy.emit({ field: 'username', value: '', id });
      return;
    }
    try {
      await navigator.clipboard?.writeText(val);
      this.onCopy.emit({ field: 'username', value: val, id });
    } catch (err) {
      this.onCopy.emit({ field: 'username', value: '', id });
    }
  }

  edit() {
    this.onEdit.emit(this.credential.id);
  }

  delete() {
    this.onDelete.emit(this.credential.id);
  }

}

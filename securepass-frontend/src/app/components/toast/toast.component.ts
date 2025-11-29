// src/app/components/toast/toast.component.ts
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent implements OnDestroy {
  toasts: Toast[] = [];
  private sub: Subscription;

  constructor(private toastService: ToastService, private cd: ChangeDetectorRef) {
    this.sub = this.toastService.toasts.subscribe(t => {
      this.toasts = [...this.toasts, t];
      this.cd.markForCheck();
      setTimeout(() => this.remove(t.id), t.duration ?? 3500);
    });
  }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cd.markForCheck();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

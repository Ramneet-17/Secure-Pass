// src/app/services/toast.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private subject = new Subject<Toast>();
  private counter = 0;

  get toasts() {
    return this.subject.asObservable();
  }

  show(message: string, type: ToastType = 'info', duration = 3500) {
    const t: Toast = { id: ++this.counter, message, type, duration };
    this.subject.next(t);
    return t.id;
  }
}

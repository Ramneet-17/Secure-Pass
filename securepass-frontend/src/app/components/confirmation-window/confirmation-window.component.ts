import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  Renderer2,
  AfterViewInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-window',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-window.component.html',
  styleUrls: ['./confirmation-window.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationWindowComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure?';
  @Input() loading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('dialog') dialogEl!: ElementRef<HTMLDivElement>;
  private lastFocused: Element | null = null;
  private boundHandleFocus = this.keepFocusInside.bind(this);

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2,
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    // ensure initial accessibility attributes
    if (this.dialogEl) {
      this.renderer.setAttribute(this.dialogEl.nativeElement, 'role', 'dialog');
      this.renderer.setAttribute(this.dialogEl.nativeElement, 'aria-modal', 'true');
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']) {
      if (this.visible) this.onOpen();
      else this.onClose();
      this.cd.markForCheck();
    }
    if (changes['loading'] || changes['title'] || changes['message']) {
      this.cd.markForCheck();
    }
  }

  ngOnDestroy() {
    this.onClose();
  }

  private onOpen() {
    // store last focused element to restore later
    this.lastFocused = document.activeElement;
    // prevent background scroll
    try { document.body.style.overflow = 'hidden'; } catch {}
    // wait a tick and focus first focusable
    setTimeout(() => {
      this.focusFirstElement();
      // start trapping focus
      document.addEventListener('focus', this.boundHandleFocus, true);
    }, 0);
  }

  private onClose() {
    // restore body scroll
    try { document.body.style.overflow = ''; } catch {}
    // remove focus trap
    document.removeEventListener('focus', this.boundHandleFocus, true);
    // restore focus
    try { (this.lastFocused as HTMLElement | null)?.focus?.(); } catch {}
  }

  private focusFirstElement() {
    const el = this.dialogEl?.nativeElement;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length) {
      focusable[0].focus();
    } else {
      el.focus();
    }
  }

  // keep focus inside dialog (simple trap)
  private keepFocusInside(event: FocusEvent) {
    if (!this.dialogEl) return;
    const el = this.dialogEl.nativeElement;
    if (!el.contains(event.target as Node)) {
      event.stopPropagation();
      this.focusFirstElement();
    }
  }

  // Keyboard: ESC cancels; Enter triggers confirm when not loading
  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (!this.visible) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!this.loading) this.cancel();
    } else if (event.key === 'Enter') {
      // Avoid accidental Enter when focus is on Cancel button; prefer explicit Confirm
      // Only trigger if focused element is inside dialog and is not a form field
      const active = document.activeElement;
      if (!this.loading && active && this.dialogEl?.nativeElement?.contains(active)) {
        // if active is a button and it's the confirm button, let it handle; otherwise do nothing
        const isInput =
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).getAttribute('contenteditable') === 'true';
        if (!isInput) {
          // don't auto-confirm; leave user to press Confirm
        }
      }
    }
  }

  confirm() {
    if (this.loading) return;
    this.confirmed.emit();
  }

  cancel() {
    if (this.loading) return;
    this.cancelled.emit();
  }
}

// src/app/app.component.ts
import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { NavbarComponent } from './components/navbar/navbar';
import { ToastComponent } from './components/toast/toast.component';
import { ConfirmationWindowComponent } from './components/confirmation-window/confirmation-window.component';
import { CredentialFormComponent } from './components/credential-form/credential-form';

import { CredentialFormService } from './services/credential-form.service';
import { CredentialService } from './services/credential';
import { ToastService } from './services/toast.service';
import { SearchService } from './services/search.service';
import { ConfirmationService } from './services/confirmation.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    ToastComponent,
    ConfirmationWindowComponent,
    CredentialFormComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  showNavbar = true;
  showAddButton = true;

  showForm$: Observable<boolean>;
  editCredential$: Observable<any | null>;

  activeConfirm: { id: string; title: string; message: string; loading: boolean } | null = null;

  constructor(
    public credentialFormService: CredentialFormService,
    private credentialService: CredentialService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private searchService: SearchService,
    private router: Router,
    private themeService: ThemeService
  ) {
    this.showForm$ = this.credentialFormService.open$;
    this.editCredential$ = this.credentialFormService.editCredential$;

    // hide navbar and add button on login routes
    this.router.events
      .pipe(filter(evt => evt instanceof NavigationEnd))
      .subscribe((evt: any) => {
        const url = evt.urlAfterRedirects;
        this.showNavbar = !(url.startsWith('/login'));
        this.showAddButton = !(url.startsWith('/login'));
      });

    // subscribe to confirmation request events
    this.confirmationService.request$.subscribe(req => {
      if (!req) {
        this.activeConfirm = null;
      } else {
        this.activeConfirm = {
          id: req.id,
          title: req.title,
          message: req.message,
          loading: !!req.loading
        };
      }
    });
  }

  onNavbarSearch(q: string) {
    this.searchService.set(q ?? '');
  }

  onRootConfirmed() {
    if (!this.activeConfirm) return;
    this.confirmationService.confirm(this.activeConfirm.id);
    this.activeConfirm = null;
  }

  onRootCancelled() {
    if (!this.activeConfirm) return;
    this.confirmationService.cancel(this.activeConfirm.id);
    this.activeConfirm = null;
  }

  onAddFromModal(ev: any) {
    this.credentialService.add(ev).subscribe({
      next: () => {
        this.credentialFormService.close();
        this.toastService.show(`Credential "${ev.site}" created successfully`, 'success', 3000);
        this.credentialFormService.emitChange();
      },
      error: (err) => {
        this.toastService.show(`Failed to create credential for "${ev.site}". Please try again.`, 'error', 4000);
      }
    });
  }

  onUpdateFromModal(ev: any) {
    this.credentialService.update(ev.id, ev).subscribe({
      next: () => {
        this.credentialFormService.close();
        this.toastService.show(`Credential "${ev.site}" updated successfully`, 'success', 3000);
        this.credentialFormService.emitChange();
      },
      error: (err) => {
        this.toastService.show(`Failed to update "${ev.site}". Please try again.`, 'error', 4000);
      }
    });
  }

  onCancelFromModal() {
    this.credentialFormService.close();
  }
}

// src/app/components/vault/vault.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { CredentialService, Credential } from '../../services/credential';
import { ConfirmationService } from '../../services/confirmation.service';
import { ToastService } from '../../services/toast.service';
import { CredentialFormService } from '../../services/credential-form.service';
import { SearchService } from '../../services/search.service';

import { CredentialCardComponent } from '../credential-card/credential-card';
import { isStrongPassword } from '../../utils/password.util';

@Component({
  selector: 'app-vault',
  standalone: true,
  imports: [
    CommonModule,
    CredentialCardComponent
  ],
  templateUrl: './vault.html',
  styleUrls: ['./vault.css']
})
export class VaultComponent implements OnInit, OnDestroy {

  credentials: Credential[] = [];
  filteredCredentials: Credential[] = [];

  searchTerm = '';
  showOnlyWeak = false;
  deleting = false;
  refreshing = false;

  private credsSub?: Subscription;
  private changesSub?: Subscription;
  private searchSub?: Subscription;

  constructor(
    public credentialFormService: CredentialFormService,
    private credentialService: CredentialService,
    private confirmation: ConfirmationService,
    private toastService: ToastService,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {

    // 1) MAIN DATA SOURCE
    this.credsSub = this.credentialService.creds$.subscribe(list => {
      this.credentials = list ?? [];
      this.applyFilter(this.searchTerm);
    });

    // 2) INITIAL LOAD
    this.credentialService.load();

    // 3) RELOAD WHEN FORM ACTION HAPPENS
    this.changesSub = this.credentialFormService.changes$
      .pipe(debounceTime(50))
      .subscribe(() => this.credentialService.load());

    // 4) SEARCH
    this.searchSub = this.searchService.search$
      .subscribe(q => {
        this.searchTerm = q ?? '';
        this.applyFilter(this.searchTerm);
      });
  }

  ngOnDestroy() {
    this.credsSub?.unsubscribe();
    this.changesSub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  trackById(_: number, item: Credential) {
    return item.id;
  }

  /** DELETE FLOW */
  async askDelete(id: number): Promise<void> {
    const cred = this.credentials.find(c => c.id === id);
    if (!cred) return;

    const handle = this.confirmation.open({
      title: 'Delete Credential',
      message: `Delete ${cred.site}? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });

    try { await handle.confirmed; }
    catch { return; }

    handle.setLoading(true);

    this.credentialService.delete(cred.id).subscribe({
      next: () => {
        this.toastService.show(`Credential "${cred.site}" deleted successfully`, 'success', 3000);
        this.credentialFormService.emitChange();
        handle.close();
      },
      error: (err) => {
        this.toastService.show(`Failed to delete "${cred.site}". Please try again.`, 'error', 4000);
        handle.close();
      }
    });
  }

  /** FILTERING */
  private applyFilter(term: string) {
    const q = (term || '').trim().toLowerCase();

    let list = this.credentials.slice();

    if (q) {
      list = list.filter(c =>
        (c.site || '').toLowerCase().includes(q) ||
        (c.username || '').toLowerCase().includes(q)
      );
    }

    if (this.showOnlyWeak) {
      list = list.filter(c => !isStrongPassword(c.password ?? ''));
    }

    this.filteredCredentials = list;
  }

  toggleWeakFilter() {
    this.showOnlyWeak = !this.showOnlyWeak;
    this.applyFilter(this.searchTerm);
  }

  onStatClick(type: 'total' | 'weak') {
    if (type === 'weak') {
      this.showOnlyWeak = true;
    } else {
      this.showOnlyWeak = false;
    }
    this.applyFilter(this.searchTerm);
  }

  /** STATS */
  get totalAccounts() { return this.credentials.length; }
  get strongPasswords() { return this.credentials.filter(c => isStrongPassword(c.password ?? '')).length; }
  get needUpdates() { return this.credentials.filter(c => !isStrongPassword(c.password ?? '')).length; }

  /** EDIT */
  onEditCredential(id: number) {
    const cred = this.credentials.find(c => c.id === id);
    if (cred) this.credentialFormService.open({ ...cred });
  }

  handleCopy(ev: any) {
    if (!ev.value || ev.value === '') {
      const fieldName = ev.field === 'password' ? 'Password' : 'Username';
      this.toastService.show(`Failed to copy ${fieldName.toLowerCase()}. Please try again.`, 'error', 4000);
      return;
    }
    
    const fieldName = ev.field === 'password' ? 'Password' : 'Username';
    const cred = this.credentials.find(c => c.id === ev.id);
    const siteName = cred?.site || 'credential';
    this.toastService.show(`${fieldName} copied from ${siteName}`, 'success', 3000);
  }

  handleToggle(ev: any) {}

  /** REFRESH CREDENTIALS */
  refreshCredentials(): void {
    if (this.refreshing) return;
    
    this.refreshing = true;
    this.credentialService.load();
    
    // Reset refreshing state after a short delay
    setTimeout(() => {
      this.refreshing = false;
      this.toastService.show('Credentials refreshed', 'success', 2000);
    }, 500);
  }
}

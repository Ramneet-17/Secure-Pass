import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CredentialService } from '../../services/credential';
import { CredentialCardComponent } from '../credential-card/credential-card';
import { CredentialFormComponent } from '../credential-form/credential-form';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-vault',
  standalone: true,
  templateUrl: './vault.html',
  styleUrls: ['./vault.css'],
  imports: [CommonModule, CredentialCardComponent, CredentialFormComponent, NavbarComponent]
})
export class VaultComponent implements OnInit {
  credentials: any[] = [];
  filteredCredentials: any[] = [];
  showForm = false;
  errorMessage = '';
  searchTerm = '';

  constructor(private credentialService: CredentialService) {}

  ngOnInit(): void {
    this.loadCredentials();
  }

  loadCredentials(): void {
    this.credentialService.getAll().subscribe({
      next: (data) => {
        this.credentials = data;
        this.filteredCredentials = data;
      },
      error: (err) => this.errorMessage = err.error || 'Failed to load credentials'
    });
  }

  onAdd(newCred: any): void {
    this.credentialService.add(newCred).subscribe({
      next: () => {
        this.showForm = false;
        this.errorMessage = '';
        this.loadCredentials();
        this.showNotification('New credential added successfully!', 'success');
      },
      error: () => {
        this.errorMessage = 'Failed to add credential';
        this.showNotification('Failed to add credential', 'error');
      }
    });
  }

  onDelete(id: number): void {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    this.credentialService.delete(id).subscribe({
      next: () => {
        this.errorMessage = '';
        this.loadCredentials();
        this.showNotification('Credential deleted successfully', 'success');
      },
      error: () => {
        this.errorMessage = 'Delete failed';
        this.showNotification('Failed to delete credential', 'error');
      }
    });
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    if (!searchTerm.trim()) {
      this.filteredCredentials = this.credentials;
      return;
    }

    this.filteredCredentials = this.credentials.filter(cred =>
      cred.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  get totalAccounts(): number {
    return this.credentials.length;
  }

  get strongPasswords(): number {
    return this.credentials.filter(cred =>
      cred.password && cred.password.length >= 8 &&
      /[A-Z]/.test(cred.password) &&
      /[0-9]/.test(cred.password) &&
      /[!@#$%^&*]/.test(cred.password)
    ).length;
  }

  get needUpdates(): number {
    return this.totalAccounts - this.strongPasswords;
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    // This could be implemented with a toast service or simple DOM manipulation
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

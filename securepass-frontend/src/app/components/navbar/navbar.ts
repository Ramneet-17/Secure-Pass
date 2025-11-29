// src/app/components/navbar/navbar.ts
import { Component, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ThemeService, Theme } from '../../services/theme.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { CredentialService, Credential } from '../../services/credential';
import { ToastService } from '../../services/toast.service';
import { ImportDialogComponent } from '../import-dialog/import-dialog.component';
import { Subject, Subscription, firstValueFrom } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ImportDialogComponent],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() onSearch = new EventEmitter<string>();
  searchTerm = '';
  
  userMenuOpen = false;
  currentTheme: Theme = 'light';
  themeSub?: Subscription;
  username: string = '';
  userEmail: string = '';

  private search$ = new Subject<string>();
  private sub?: Subscription;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private themeService: ThemeService,
    private confirmationService: ConfirmationService,
    private credentialService: CredentialService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.sub = this.search$.pipe(debounceTime(250)).subscribe(q => {
      this.onSearch.emit(q);
    });

    this.themeSub = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    // Get username from auth service
    this.username = this.authService.getUsername();
    this.userEmail = `${this.username}@securepass.com`;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.themeSub?.unsubscribe();
  }

  onSearchInput(): void {
    this.search$.next(this.searchTerm ?? '');
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-container')) {
      this.closeUserMenu();
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.closeUserMenu();
  }

  async signOut(): Promise<void> {
    this.closeUserMenu();
    
    const handle = this.confirmationService.open({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign Out',
      cancelLabel: 'Cancel'
    });

    try {
      await handle.confirmed;
      this.authService.logout();
      this.router.navigate(['/login']);
    } catch {
      // User cancelled
    }
  }

  exportCredentials(format: 'json' | 'csv'): void {
    this.closeUserMenu();
    
    // Use firstValueFrom to get current value immediately, or wait for next emission
    firstValueFrom(this.credentialService.creds$).then(creds => {
      if (!creds || creds.length === 0) {
        this.toastService.show('No credentials to export', 'info', 3000);
        return;
      }

      if (format === 'json') {
        this.exportAsJSON(creds);
      } else {
        this.exportAsCSV(creds);
      }
    }).catch(() => {
      this.toastService.show('Failed to export credentials', 'error', 3000);
    });
  }

  private exportAsJSON(creds: Credential[]): void {
    try {
      // Only include site, username, and password fields
      const exportData = creds.map(c => ({
        site: c.site || '',
        username: c.username || '',
        password: c.password || ''
      }));
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(dataBlob);
      
      // Create and configure the download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `credentials-${new Date().toISOString().split('T')[0]}.json`;
      link.style.display = 'none'; // Hide the link
      
      // Add to DOM, click, then remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      this.toastService.show(`Exported ${creds.length} credentials as JSON`, 'success', 3000);
    } catch (error) {
      this.toastService.show('Failed to export JSON file', 'error', 3000);
    }
  }

  private exportAsCSV(creds: Credential[]): void {
    try {
      const headers = ['Site', 'Username', 'Password'];
      const rows = creds.map(c => [
        c.site || '',
        c.username || '',
        c.password || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const escaped = String(cell).replace(/"/g, '""');
          if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
            return `"${escaped}"`;
          }
          return escaped;
        }).join(','))
      ].join('\n');

      // Add BOM for Excel compatibility
      const BOM = '\uFEFF';
      const dataBlob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(dataBlob);
      
      // Create and configure the download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `credentials-${new Date().toISOString().split('T')[0]}.csv`;
      link.style.display = 'none'; // Hide the link
      
      // Add to DOM, click, then remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      this.toastService.show(`Exported ${creds.length} credentials as CSV`, 'success', 3000);
    } catch (error) {
      this.toastService.show('Failed to export CSV file', 'error', 3000);
    }
  }

  importCredentials(): void {
    this.closeUserMenu();
    this.showImportDialog = true;
  }

  showImportDialog = false;

  onImportFileSelected(file: File): void {
    this.showImportDialog = false;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      const fileName = file.name.toLowerCase();

      try {
        let credentials: Credential[] = [];

        if (fileName.endsWith('.json')) {
          credentials = this.parseJSON(content);
        } else if (fileName.endsWith('.csv')) {
          credentials = this.parseCSV(content);
        } else {
          this.toastService.show('Unsupported file format. Please use JSON or CSV.', 'error', 4000);
          return;
        }

        if (credentials.length === 0) {
          this.toastService.show('No valid credentials found in file', 'error', 4000);
          return;
        }

        // Send to backend
        this.credentialService.bulkImport(credentials).subscribe({
          next: (response) => {
            // Backend returns JSON with message like "Saved 10 credentials" - extract number if possible
            const message = response.message || 'Credentials imported';
            const match = message.match(/\d+/);
            const count = match ? match[0] : credentials.length;
            this.toastService.show(`Successfully imported ${count} credentials`, 'success', 3000);
          },
          error: (err: any) => {
            // Handle 401/403 errors - check if it's auth or validation
            if (err.status === 401 || err.status === 403) {
              const errorBody = err.error;
              
              // If error body is null/undefined, check if we have a valid token
              // A 403 with null body often means missing/invalid auth token
              if (!errorBody || errorBody === null) {
                const token = this.authService.getToken();
                if (!token) {
                  // No token - definitely an auth issue
                  this.toastService.show('Authentication failed. Please log in again.', 'error', 4000);
                  setTimeout(() => {
                    this.authService.logout();
                    this.router.navigate(['/login']);
                  }, 1500);
                  return;
                } else {
                  // Token exists but got 403 with null body - likely expired or invalid token
                  // Check response headers for auth-related info
                  const wwwAuth = err.headers?.get('WWW-Authenticate');
                  if (wwwAuth || err.status === 401) {
                    this.toastService.show('Your session has expired. Please log in again.', 'error', 4000);
                    setTimeout(() => {
                      this.authService.logout();
                      this.router.navigate(['/login']);
                    }, 1500);
                    return;
                  }
                  // 403 with token - might be permission issue, validation error, or expired token
                  // Show more helpful error message
                  this.toastService.show('Import failed: Access denied (403). Token may be expired - try logging out and back in.', 'error', 6000);
                  return;
                }
              }
              
              // We have an error body - check the message
              const errorMessage = typeof errorBody === 'string' 
                ? errorBody.toLowerCase() 
                : (errorBody?.message || errorBody?.error || '').toLowerCase();
              
              // Check if it's actually an authentication error
              const isAuthError = errorMessage.includes('token') || 
                                 errorMessage.includes('unauthorized') || 
                                 errorMessage.includes('authentication') ||
                                 errorMessage.includes('expired') ||
                                 errorMessage.includes('invalid credentials') ||
                                 errorMessage.includes('forbidden');
              
              if (isAuthError) {
                // Real auth error - logout and redirect
                this.toastService.show('Authentication failed. Please try logging in again.', 'error', 4000);
                setTimeout(() => {
                  this.authService.logout();
                  this.router.navigate(['/login']);
                }, 1500);
                return;
              }
              
              // It's a validation/data error, not auth - show the actual error
              const displayMessage = typeof errorBody === 'string' 
                ? errorBody 
                : (errorBody?.message || errorBody?.error || 'Invalid data format');
              this.toastService.show(`Import failed: ${displayMessage}`, 'error', 5000);
              return;
            }
            
            // Show specific error message
            let errorMessage = 'Failed to import credentials.';
            if (err.error) {
              if (typeof err.error === 'string') {
                errorMessage = err.error;
              } else if (err.error.message) {
                errorMessage = err.error.message;
              } else if (err.error.error) {
                errorMessage = err.error.error;
              }
            } else if (err.status === 400) {
              errorMessage = 'Invalid file format. Please check your JSON/CSV structure matches the expected format.';
            } else if (err.status === 0) {
              errorMessage = 'Network error. Please check your connection and try again.';
            } else if (err.status >= 500) {
              errorMessage = 'Server error. Please try again later.';
            }
            
            this.toastService.show(`Import failed: ${errorMessage}`, 'error', 5000);
          }
        });
      } catch (error: any) {
        const errorMessage = error?.message || 'Error parsing file. Please check the format.';
        this.toastService.show(`Parse error: ${errorMessage}`, 'error', 5000);
      }
    };
    
    reader.onerror = () => {
      this.toastService.show('Error reading file. Please try again.', 'error', 4000);
    };
    
    reader.readAsText(file);
  }

  onImportCancelled(): void {
    this.showImportDialog = false;
  }

  async removeDuplicates(): Promise<void> {
    this.closeUserMenu();
    
    try {
      const creds = await firstValueFrom(this.credentialService.creds$);
      
      if (!creds || creds.length === 0) {
        this.toastService.show('No credentials found', 'info', 3000);
        return;
      }

      // Find duplicates: credentials with the same site AND username (case-insensitive)
      // Keep the first occurrence, mark subsequent ones as duplicates
      const seen = new Map<string, Credential>();
      const duplicates: Credential[] = [];

      for (const cred of creds) {
        // Create a unique key from site + username (both must match for duplicate)
        const site = (cred.site || '').toLowerCase().trim();
        const username = (cred.username || '').toLowerCase().trim();
        const key = `${site}|${username}`;
        
        if (seen.has(key)) {
          // This is a duplicate (same site AND username as a previous credential)
          duplicates.push(cred);
        } else {
          // First occurrence - keep it
          seen.set(key, cred);
        }
      }

      if (duplicates.length === 0) {
        this.toastService.show('No duplicates found', 'info', 3000);
        return;
      }

      // Show confirmation dialog
      const handle = this.confirmationService.open({
        title: 'Remove Duplicates',
        message: `Found ${duplicates.length} duplicate credential(s). This will keep the first occurrence of each unique site+username combination and delete the rest. Continue?`,
        confirmLabel: 'Remove Duplicates',
        cancelLabel: 'Cancel'
      });

      handle.confirmed.then(async () => {
        try {
          handle.setLoading(true);
          
          // Delete duplicates one by one
          let deletedCount = 0;
          let errorCount = 0;

          for (const dup of duplicates) {
            try {
              await firstValueFrom(this.credentialService.delete(dup.id));
              deletedCount++;
            } catch (err) {
              errorCount++;
            }
          }

          handle.close();

          if (errorCount > 0) {
            this.toastService.show(
              `Removed ${deletedCount} duplicate(s). ${errorCount} failed to delete.`,
              'error',
              4000
            );
          } else {
            this.toastService.show(
              `Successfully removed ${deletedCount} duplicate credential(s)`,
              'success',
              3000
            );
          }
        } catch (err) {
          handle.close();
          this.toastService.show('Failed to remove duplicates', 'error', 4000);
        }
      }).catch(() => {
        // User cancelled
      });
    } catch (err) {
      this.toastService.show('Failed to load credentials', 'error', 3000);
    }
  }

  private parseJSON(content: string): Credential[] {
    let data: any;
    try {
      data = JSON.parse(content);
    } catch (e) {
      throw new Error('Invalid JSON format. Please check your file syntax.');
    }
    
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of credential objects. Example: [{ "site": "...", "username": "...", "password": "..." }]');
    }
    
    if (data.length === 0) {
      throw new Error('JSON array is empty. Please include at least one credential.');
    }
    
    const credentials = data.map((item: any, index: number) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Invalid credential at index ${index}: must be an object`);
      }
      return {
        id: 0, // Backend will assign IDs
        site: String(item.site || '').trim(),
        username: String(item.username || '').trim(),
        password: item.password ? String(item.password).trim() : undefined
      };
    });
    
    const validCredentials = credentials.filter((c: Credential) => {
      return c.site && c.username;
    });
    
    if (validCredentials.length === 0) {
      throw new Error('No valid credentials found. Each credential must have both "site" and "username" fields.');
    }
    
    return validCredentials;
  }

  private parseCSV(content: string): Credential[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const siteIndex = headers.findIndex(h => h === 'site');
    const usernameIndex = headers.findIndex(h => h === 'username');
    const passwordIndex = headers.findIndex(h => h === 'password');

    if (siteIndex === -1 || usernameIndex === -1) {
      throw new Error('CSV must have "site" and "username" columns');
    }

    const credentials: Credential[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values[siteIndex] && values[usernameIndex]) {
        credentials.push({
          id: 0, // Backend will assign IDs
          site: values[siteIndex],
          username: values[usernameIndex],
          password: values[passwordIndex] || ''
        });
      }
    }
    return credentials;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }
}

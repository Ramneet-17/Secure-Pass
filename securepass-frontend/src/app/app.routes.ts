import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { VaultComponent } from './components/vault/vault';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'vault', component: VaultComponent }
];

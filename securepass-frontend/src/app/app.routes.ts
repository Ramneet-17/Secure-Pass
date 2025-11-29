import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { VaultComponent } from './components/vault/vault';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'vault', component: VaultComponent, canActivate: [authGuard] }
];

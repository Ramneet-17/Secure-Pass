// src/app/services/credential-form.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CredentialFormService {
  // modal open state
  private _open$ = new BehaviorSubject<boolean>(false);
  readonly open$ = this._open$.asObservable();

  // current credential for edit mode (null = add mode)
  private _edit$ = new BehaviorSubject<any | null>(null);
  readonly editCredential$ = this._edit$.asObservable();

  // notify other parts of app when credentials changed (add/update/delete)
  private _changes = new Subject<void>();
  readonly changes$ = this._changes.asObservable();

  open(editCredential: any | null = null) {
    this._edit$.next(editCredential);
    this._open$.next(true);
  }

  close() {
    this._open$.next(false);
    // clear edit after slight delay (so bindings stabilize)
    setTimeout(() => this._edit$.next(null));
  }

  toggle() {
    const newVal = !this._open$.value;
    this._open$.next(newVal);
    if (!newVal) this._edit$.next(null);
  }

  emitChange() {
    this._changes.next();
  }
}

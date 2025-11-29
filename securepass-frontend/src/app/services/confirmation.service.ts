// src/app/services/confirmation.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmationRequest {
  id: string; // unique id
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

/**
 * A small confirmation service that exposes a request stream.
 * open(...) returns a handle with:
 *  - confirmed: Promise<void>   (resolves when user clicks Confirm)
 *  - setLoading(flag)          (show spinner in dialog)
 *  - close()                   (close dialog and reject/resolve appropriately)
 *
 * The root component subscribes to request$ to render the ConfirmationWindowComponent.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private _request$ = new BehaviorSubject<ConfirmationRequest | null>(null);
  readonly request$ = this._request$.asObservable();

  // internal map of resolvers keyed by request.id
  private resolvers = new Map<string, { resolve: () => void; reject: (reason?: any) => void }>();

  open(opts: {
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
  } = {}) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const request: ConfirmationRequest = {
      id,
      title: opts.title ?? 'Confirm',
      message: opts.message ?? 'Are you sure?',
      confirmLabel: opts.confirmLabel ?? 'Confirm',
      cancelLabel: opts.cancelLabel ?? 'Cancel',
      loading: false
    };

    // create the promise that caller will await
    let resolve!: () => void;
    let reject!: (reason?: any) => void;
    const p = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // store resolvers
    this.resolvers.set(id, { resolve, reject });

    // publish the request so UI picks it up
    this._request$.next(request);

    // return the "handle" object expected by callers
    const handle = {
      confirmed: p,
      setLoading: (flag: boolean) => {
        const current = this._request$.value;
        if (current && current.id === id) {
          this._request$.next({ ...current, loading: !!flag });
        }
      },
      close: () => {
        // clean up and signal resolved (if still pending)
        const r = this.resolvers.get(id);
        if (r) {
          r.resolve();
          this.resolvers.delete(id);
        }
        // clear UI
        if (this._request$.value?.id === id) this._request$.next(null);
      },
      // also expose internal helpers so AppComponent can confirm/cancel imperatively:
      _internal: { id }
    };

    // return handle
    return handle;
  }

  // Called by UI when user confirms (root component should call this)
  confirm(id: string) {
    const r = this.resolvers.get(id);
    if (r) {
      r.resolve();
      this.resolvers.delete(id);
    }
    if (this._request$.value?.id === id) this._request$.next(null);
  }

  // Called by UI when user cancels
  cancel(id: string) {
    const r = this.resolvers.get(id);
    if (r) {
      r.reject(new Error('Cancelled'));
      this.resolvers.delete(id);
    }
    if (this._request$.value?.id === id) this._request$.next(null);
  }
}

// src/app/services/search.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private _q$ = new BehaviorSubject<string>('');
  readonly search$ = this._q$.asObservable();

  set(q: string) {
    this._q$.next(q ?? '');
  }

  clear() {
    this._q$.next('');
  }
}

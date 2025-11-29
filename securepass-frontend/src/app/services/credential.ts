// src/app/services/credential.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, exhaustMap, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response';

export interface Credential {
  id: number;
  site: string;
  username: string;
  password?: string;
  // extend as needed
}

@Injectable({
  providedIn: 'root'
})
export class CredentialService {
  private baseUrl = `${environment.apiUrl}/vault`;
  private _creds$ = new BehaviorSubject<Credential[]>([]);
  readonly creds$ = this._creds$.asObservable();

  // trigger subject used to coalesce multiple load() calls
  private loadTrigger = new Subject<{ stack?: string }>();
  private lastEmittedKey: string | null = null;


  constructor(private http: HttpClient) {
    
    // coalesce rapid load() calls into a single HTTP request
    // Token is automatically added by auth interceptor
    this.loadTrigger.pipe(
      debounceTime(50),
      exhaustMap(() => {
        return this.http.get<Credential[]>(this.baseUrl).pipe(
          catchError(err => {
            // Silently handle errors - component will handle display
            return of([] as Credential[]);
          })
        );
      })
    ).subscribe((list) => {
      // dedupe by id (keeps first occurrence)
      const map = new Map<number, Credential>();
      for (const c of (list ?? [])) {
        if (c && typeof c.id !== 'undefined') map.set(c.id, c);
      }
      const deduped = Array.from(map.values());

      // build stable key to detect identical payloads (IDs + JSON)
      const idString = deduped.map(d => d.id).join(',');
      const jsonString = JSON.stringify(deduped);
      const key = `${idString}|${jsonString}`;

      if (this.lastEmittedKey === key) {
        return; // skip emitting identical payload
      }

      this.lastEmittedKey = key;
      this._creds$.next(deduped);
    });
  }

  /**
   * Request a reload. Multiple rapid calls will be coalesced into one network request.
   */
  load(): void {
    this.loadTrigger.next({});
  }

  add(cred: Partial<Credential>): Observable<string> {
    // Token is automatically added by auth interceptor
    return this.http.post<ApiResponse>(`${this.baseUrl}`, cred).pipe(
      map(response => response.message || 'Credential saved'),
      tap(() => this.load())
    );
  }

  delete(id: number): Observable<string> {
    // Token is automatically added by auth interceptor
    return this.http.delete<ApiResponse>(`${this.baseUrl}/${id}`).pipe(
      map(response => response.message || 'Deleted'),
      tap(() => this.load())
    );
  }

  update(id: number, payload: Partial<Credential>): Observable<string> {
    // Token is automatically added by auth interceptor
    return this.http.put<ApiResponse>(`${this.baseUrl}/${id}`, payload).pipe(
      map(response => response.message || 'Updated'),
      tap(() => this.load())
    );
  }

  bulkImport(credentials: Credential[]): Observable<ApiResponse> {
    // Remove id field for bulk import (backend will assign IDs)
    const payload = credentials.map(c => ({
      site: c.site,
      username: c.username,
      password: c.password || undefined
    }));
    
    const endpoint = `${this.baseUrl}/batch`; // Backend uses /batch endpoint
    
    // Token is automatically added by auth interceptor
    // Backend returns JSON response with ApiResponse format
    return this.http.post<ApiResponse>(endpoint, payload).pipe(
      tap(() => {
        this.load();
      }),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }
}

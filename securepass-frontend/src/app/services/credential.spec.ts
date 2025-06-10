import { TestBed } from '@angular/core/testing';

import { CredentialService } from './credential';

describe('Credential', () => {
  let service: CredentialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CredentialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { isJwtExpired, jwtExpiresAt } from './jwt';

function fakeToken(payload: object): string {
    const base64url = (s: string) => btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${base64url('{"alg":"HS256"}')}.${base64url(JSON.stringify(payload))}.firma`;
}

describe ('jwt', () => {
  it('legge la scadenza (exp, in secondi) e la restituisce in millisecondi', () => {
    expect(jwtExpiresAt(fakeToken({ exp: 2000 }))).toBe(2_000_000);
  });

  it('considera scaduto un token con exp nel passato', () => {
    expect(isJwtExpired(fakeToken({ exp: 1000 }), 2_000_000)).toBeTrue();
  });

  it('considera valido un token con exp nel futuro', () => {
    expect(isJwtExpired(fakeToken({ exp: 3000 }), 2_000_000)).toBeFalse();
  });

  it('considera scaduto un token malformato', () => {
    expect(isJwtExpired('non-un-jwt')).toBeTrue();
  });
})
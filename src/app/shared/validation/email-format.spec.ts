import { FormControl } from '@angular/forms';
import { emailFormat, isValidEmail } from './email-format';

describe('isValidEmail', () => {
  const valid = [
    'mario.rossi@test.com',
    'a@b.it',
    'user+tag@sub.domain.example.org',
    'first_last%x@my-domain.co.uk',
    'UPPER.Case@Example.COM',
    '  spaced@test.it  ',
    'n0digits@x1.io',
  ];
  const invalid = [
    '',
    '   ',
    'plainaddress',
    'a@b',
    'a@b.c',
    'a@b.c1',
    'a@bb',
    'mario@localhost',
    'a@@b.it',
    'a@b@c.it',
    '@b.it',
    'a@.it',
    'a@b..it',
    'a@b.it.',
    'a@-b.it',
    'a@b-.it',
    'a b@x.it',
    'a@b c.it',
    '.a@x.it',
    'a.@x.it',
    'a..b@x.it',
    'a@[127.0.0.1]',
    '"quoted"@x.it',
    'àb@x.it',
    'a@bücher.de',
    'a,b@x.it',
  ];

  valid.forEach((email) => it(`accepts "${email}"`, () => expect(isValidEmail(email)).toBeTrue()));
  invalid.forEach((email) => it(`refuses "${email}"`, () => expect(isValidEmail(email)).toBeFalse()));

  it('accepts a local part of 64 characters and refuses 65', () => {
    expect(isValidEmail('a'.repeat(64) + '@x.it')).toBeTrue();
    expect(isValidEmail('a'.repeat(65) + '@x.it')).toBeFalse();
  });

  it('accepts a whole address of 254 characters and refuses 255', () => {
    const domainPrefix = ('b'.repeat(63) + '.').repeat(3);
    expect(isValidEmail('a@' + domainPrefix + 'b'.repeat(57) + '.it')).toBeTrue();
    expect(isValidEmail('a@' + domainPrefix + 'b'.repeat(58) + '.it')).toBeFalse();
  });

  it('accepts a label of 63 characters and refuses 64', () => {
    expect(isValidEmail('a@' + 'b'.repeat(63) + '.it')).toBeTrue();
    expect(isValidEmail('a@' + 'b'.repeat(64) + '.it')).toBeFalse();
  });
});

describe('emailFormat', () => {
  it('leaves an empty field to the "required" validator', () => {
    expect(emailFormat(new FormControl('', { nonNullable: true }))).toBeNull();
  });

  it('accepts a valid address', () => {
    expect(emailFormat(new FormControl('anna@test.it', { nonNullable: true }))).toBeNull();
  });

  it('reports an address that the backend would refuse', () => {
    expect(emailFormat(new FormControl('anna@test', { nonNullable: true }))).toEqual({ emailFormat: true });
  });
});
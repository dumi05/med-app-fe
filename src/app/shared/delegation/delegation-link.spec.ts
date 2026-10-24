import { delegationLink } from './delegation-link';

describe('delegationLink', () => {
    it('builds the addess of the public page with the given origin', () => {
        expect(delegationLink('abc-123', 'https://studio.example')).toBe('https://studio.example/delegation/abc-123');
    });
    it('uses the origin of the current page by default', () => {
        expect(delegationLink('abc-123')).toBe(`${window.location.origin}/delegation/abc-123`);
    });

  it('encodes the token', () => {
    expect(delegationLink('a/b', 'https://x.it')).toBe('https://x.it/delegation/a%2Fb');
  });
});
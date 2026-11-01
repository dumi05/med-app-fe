import { passwordChecks, passwordIsAcceptable } from './password-checks';

const CONTEXT = { email: 'mario.rossi@clinic.it', firstName: 'Mario', lastName: 'Rossi' };

const failed = (password: string, context = CONTEXT) =>
  passwordChecks(password, context).filter((check) => !check.ok).map((check) => check.id);

/** The first `count` distinct emoji: 4 bytes each, one character each. */
const emoji = (count: number) => Array.from({ length: count }, (_, i) => String.fromCodePoint(0x1f600 + i)).join('');

describe('passwordChecks', () => {
  it('lists the four rules, with a label in Italian each', () => {
    const checks = passwordChecks('Tavolo-Viola-Nuvola-42', CONTEXT);

    expect(checks.map((check) => check.id)).toEqual(['length', 'bytes', 'pattern', 'personal']);
    expect(checks.every((check) => check.ok)).toBeTrue();
    expect(checks[0].label).toContain('Almeno 12 caratteri');
    expect(checks[1].label).toContain('72 byte');
  });

  it('accepts a passphrase with spaces and no symbols, and Unicode', () => {
    expect(failed('il mio gatto dorme sul divano')).toEqual([]);
    expect(failed('contraseña-ñandú-ünïcode')).toEqual([]);
  });

  describe('length', () => {
    it('refuses 11 characters and accepts 12', () => {
      expect(failed('Kx9-Lm2-Qz7')).toEqual(['length']);
      expect(failed('Kx9-Lm2-Qz7a')).toEqual([]);
    });

    it('counts characters, not bytes: 11 emoji are too short, 12 are enough', () => {
      expect(failed(emoji(11))).toEqual(['length']);
      expect(failed(emoji(12))).toEqual([]);
    });

    it('refuses a password of spaces only', () => {
      expect(failed('            ')).toContain('length');
    });

    it('does not remove the spaces of the passphrase', () => {
      expect(failed('tavolo viola ')).toEqual([]);
    });
  });

  describe('bytes', () => {
    const ascii = (length: number) =>
      'tavolo-viola-nuvola-finestra-bicicletta-montagna-ruota-mela-pera-uva-limone-cedro-fico'.slice(0, length);

    it('accepts 72 bytes and refuses 73', () => {
      expect(failed(ascii(72))).toEqual([]);
      expect(failed(ascii(73))).toEqual(['bytes']);
    });

    it('counts bytes: 18 emoji are 72 bytes, 19 are too many', () => {
      expect(failed(emoji(18))).toEqual([]);
      expect(failed(emoji(19))).toEqual(['bytes']);
    });
  });

  describe('pattern', () => {
    it('refuses one character repeated', () => {
      expect(failed('aaaaaaaaaaaa')).toEqual(['pattern']);
      expect(failed('!!!!!!!!!!!!')).toEqual(['pattern']);
    });

    it('refuses a block repeated', () => {
      expect(failed('abcabcabcabc')).toEqual(['pattern']);
      expect(failed('x7#x7#x7#x7#')).toEqual(['pattern']);
    });

    it('refuses a stretch of a sequence, forwards or backwards', () => {
      expect(failed('abcdefghijkl')).toEqual(['pattern']);
      expect(failed('lkjihgfedcba')).toEqual(['pattern']);
      expect(failed('123456789012')).toEqual(['pattern']);
      expect(failed('210987654321')).toEqual(['pattern']);
      expect(failed('qwertyuiopas')).toEqual(['pattern']);
    });

    it('accepts a sequence inside a longer password', () => {
      expect(failed('abcdefghijkl-tavolo-9')).toEqual([]);
    });

    it('finds nothing wrong in an empty password', () => {
      expect(passwordChecks('', CONTEXT).find((check) => check.id === 'pattern')!.ok).toBeTrue();
    });
  });

  describe('personal data', () => {
    it('refuses the part of the e-mail before the at', () => {
      expect(failed('il-mio-mario.rossi-99')).toEqual(['personal']);
      expect(failed('ilmiomariorossi99')).toEqual(['personal']);
    });

    it('refuses the name and the surname', () => {
      const anna = { email: 'x@clinic.it', firstName: 'Anna', lastName: 'Verdi' };

      expect(failed('Verdi-e-viola-2026', anna)).toEqual(['personal']);
      expect(failed('anna-e-il-tavolo-7', anna)).toEqual(['personal']);
    });

    it('ignores the short names and the short parts of the e-mail', () => {
      expect(failed('li-tavolo-viola-nuvola', { email: 'li@clinic.it', firstName: 'Li', lastName: 'Wu' })).toEqual([]);
      expect(failed('mia-tavolo-viola-nuvola-42', { email: 'mia@clinic.it', firstName: 'Mia', lastName: 'Wu' })).toEqual(['personal']);
      expect(failed('mi-tavolo-viola-nuvola-42', { email: 'mia@clinic.it', firstName: 'Mi', lastName: 'Wu' })).toEqual([]);
      expect(failed('mia-tavolo-viola-nuvola-42', { email: 'mia@clinic.it', firstName: 'Zed', lastName: 'Wu' })).toEqual([]);
      expect(failed('rossi-tavolo-viola-nuvola-42', { email: 'rossi@clinic.it', firstName: 'Zed', lastName: 'Wu' })).toEqual(['personal']);
    });

    it('refuses the name of the application', () => {
      expect(failed('il-mio-studiomedico-01')).toEqual(['personal']);
      expect(failed('LaMole-Torino-2026')).toEqual(['personal']);
    });

    it('works without the e-mail and the names', () => {
      expect(failed('Tavolo-Viola-Nuvola-42', { email: '', firstName: '', lastName: '' })).toEqual([]);
      expect(passwordIsAcceptable('Tavolo-Viola-Nuvola-42')).toBeTrue();
    });
  });
});

describe('passwordIsAcceptable', () => {
  it('is true only when every rule is respected', () => {
    expect(passwordIsAcceptable('Tavolo-Viola-Nuvola-42', CONTEXT)).toBeTrue();
    expect(passwordIsAcceptable('corta', CONTEXT)).toBeFalse();
    expect(passwordIsAcceptable('ilmiomariorossi99', CONTEXT)).toBeFalse();
  });
});
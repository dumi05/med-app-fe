import { ACCOUNT_ITEM, navItemsFor } from './navigation';

describe('navItemsFor',  () => {
    const areaOf = (role: 'PATIENT' | 'DOCTOR' | 'ADMIN') => navItemsFor(role).filter((item) => item !== ACCOUNT_ITEM);

    it('returns the links of each role, all inside the area of that role (the page of the account apart)', () => {
        expect(areaOf('PATIENT').every((item) => item.path.startsWith('/patient'))).toBeTrue();
        expect(areaOf('DOCTOR').every((item) => item.path.startsWith('/doctor'))).toBeTrue();
        expect(areaOf('ADMIN').every((item) => item.path.startsWith('/admin'))).toBeTrue();
    });

    it('every role can change the password: the same last link', () => {
        for (const role of ['PATIENT', 'DOCTOR', 'ADMIN'] as const) {
            expect(navItemsFor(role).at(-1)).toEqual({ label: 'Cambia password', path: '/account/password' });
        }
    });

    it('shows nothing but the change of the password when the password must be changed', () => {
        expect(navItemsFor('DOCTOR', true)).toEqual([ACCOUNT_ITEM]);
    });
    
    it('every role has at least the home link', () => {
        expect(navItemsFor('PATIENT').length).toBeGreaterThan(0);
        expect(navItemsFor('DOCTOR').length).toBeGreaterThan(0);
        expect(navItemsFor('ADMIN').length).toBeGreaterThan(0);
    });

    it('returns no links without a role.', () => {
        expect(navItemsFor(null)).toEqual([]);
    })
})
import { navItemsFor } from './navigation';

describe('navItemsFor',  () => {
    it('returns the links of each role, all inside the area of that role', () => {
        expect(navItemsFor('PATIENT').every((item) => item.path.startsWith('/patient'))).toBeTrue();
        expect(navItemsFor('DOCTOR').every((item) => item.path.startsWith('/doctor'))).toBeTrue();
        expect(navItemsFor('ADMIN').every((item) => item.path.startsWith('/admin'))).toBeTrue();
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
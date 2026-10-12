import { toSelectOptions } from './specialization-options';

describe('toSelectOptions', () => {
    it('maps id and name to value and label', () => {
        expect(toSelectOptions([{ id: 1, name: 'Cardiologia'}, { id: 2, name: 'Dermatologia'} ])).toEqual([
            { value: '1', label: 'Cardiologia' },
            { value: '2', label: 'Dermatologia'}
        ]);
    });
});
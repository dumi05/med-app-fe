import { downloadJson } from './download-json';

describe('downloadJson', () => {
    let blobs: Blob[];
    let clicked: HTMLAnchorElement[];

    beforeEach(() => {
        blobs = [];
        clicked = [];
        spyOn(URL, 'createObjectURL').and.callFake((blob: Blob | MediaSource) => {
            blobs.push(blob as Blob);
            return 'blob:test';
        });
        spyOn(URL, 'revokeObjectURL');
        spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement){
            clicked.push(this);
        });
    });

    it('offers the file to the browser with the given name', () => {
        downloadJson('dati.json', {a: 1});

        expect(clicked.length).toBe(1);
        expect(clicked[0].download).toBe('dati.json');
        expect(clicked[0].href).toBe('blob:test');
    });
    it('writes the data as readable JSON', async () => {
        downloadJson('dati.json', {a: 1});

        expect(blobs[0].type).toBe('application/json');
        expect(await blobs[0].text()).toBe('{\n  "a": 1\n}');
    });
    it('reòeases the temporary address', () => {
        downloadJson('dati.json', {});

        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });
});
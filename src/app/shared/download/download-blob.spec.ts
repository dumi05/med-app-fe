import { downloadBlob, filenameFrom } from './download-blob';

describe('downloadBlob', () => {
  let clicked: HTMLAnchorElement[];

  beforeEach(() => {
    clicked = [];
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
  });

  it('offers the file to the browser with the given name', () => {
    const blob = new Blob(['x']);

    downloadBlob('referto-3.pdf', blob);

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clicked.length).toBe(1);
    expect(clicked[0].download).toBe('referto-3.pdf');
    expect(clicked[0].href).toBe('blob:test');
  });

  it('releases the temporary address', () => {
    downloadBlob('referto-3.pdf', new Blob(['x']));

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});

describe('filenameFrom', () => {
  it('reads the name between quotes', () => {
    expect(filenameFrom('attachment; filename="referto-3.pdf"', 'x')).toBe('referto-3.pdf');
  });

  it('reads the name without quotes', () => {
    expect(filenameFrom('attachment; filename=referto-3.jpg', 'x')).toBe('referto-3.jpg');
  });

  it('uses the fallback when the header is missing or has no name', () => {
    expect(filenameFrom(null, 'referto-3')).toBe('referto-3');
    expect(filenameFrom('attachment', 'referto-3')).toBe('referto-3');
    expect(filenameFrom('attachment; filename=""', 'referto-3')).toBe('referto-3');
  });

  it('never lets the name point to another folder', () => {
    expect(filenameFrom('attachment; filename="../../etc/passwd"', 'x')).toBe('.._.._etc_passwd');
    expect(filenameFrom('attachment; filename="..\\evil.exe"', 'x')).toBe('.._evil.exe');
  });

  it('refuses a name made only of dots', () => {
    expect(filenameFrom('attachment; filename=".."', 'referto-3')).toBe('referto-3');
  });
});
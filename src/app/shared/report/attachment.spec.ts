import { ApiError } from '../http/api-error';
import { DOCX_TYPE, MAX_ATTACHMENT_BYTES, attachmentErrorMessage, attachmentLabel, attachmentProblem, formatSize } from './attachment';

const fileOf = (type: string, size: number) => new File([new Uint8Array(size)], 'x', { type });
const apiError = (status: number, code = 'SERVER_ERROR'): ApiError => ({ status, code, message: 'x' });

describe('attachmentProblem', () => {
  it('accepts a PDF, a Word document, a JPEG and a PNG', () => {
    expect(attachmentProblem(fileOf('application/pdf', 10))).toBeNull();
    expect(attachmentProblem(fileOf(DOCX_TYPE, 10))).toBeNull();
    expect(attachmentProblem(fileOf('image/jpeg', 10))).toBeNull();
    expect(attachmentProblem(fileOf('image/png', 10))).toBeNull();
  });

  it('refuses any other type, with the list of the ones that are accepted', () => {
    expect(attachmentProblem(fileOf('text/html', 10))).toBe('Sono ammessi solo file PDF, Word (.docx), JPEG e PNG.');
    expect(attachmentProblem(fileOf('application/x-msdownload', 10))).toContain('PDF, Word (.docx), JPEG e PNG');
    expect(attachmentProblem(fileOf('', 10))).toContain('PDF, Word (.docx), JPEG e PNG');
  });

  it('accepts a .docx that the computer gives without a type, and only that', () => {
    const named = (name: string, type: string) => new File([new Uint8Array(10)], name, { type });

    expect(attachmentProblem(named('referto.docx', ''))).toBeNull();
    expect(attachmentProblem(named('REFERTO.DOCX', ''))).toBeNull();
    expect(attachmentProblem(named('referto.doc', ''))).toContain('Sono ammessi solo file');
    expect(attachmentProblem(named('referto.docx', 'text/html'))).toContain('Sono ammessi solo file');
    expect(attachmentProblem(named('referto.exe', ''))).toContain('Sono ammessi solo file');
  });

  it('does not take the names of the object prototype for known types', () => {
    expect(attachmentProblem(fileOf('constructor', 10))).toContain('PDF, Word (.docx), JPEG e PNG');
  });

  it('refuses an empty file', () => {
    expect(attachmentProblem(fileOf('application/pdf', 0))).toBe('Il file è vuoto.');
  });

  it('accepts exactly 10 MB and refuses one byte more', () => {
    expect(attachmentProblem(fileOf('application/pdf', MAX_ATTACHMENT_BYTES))).toBeNull();
    expect(attachmentProblem(fileOf('application/pdf', MAX_ATTACHMENT_BYTES + 1))).toBe('Il file supera la dimensione massima di 10 MB.');
  });
});

describe('formatSize', () => {
  it('writes bytes, kilobytes and megabytes', () => {
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(250_880)).toBe('245 KB');
    expect(formatSize(2_621_440)).toBe('2,5 MB');
  });
});

describe('attachmentLabel', () => {
  it('writes the type and the size', () => {
    expect(attachmentLabel({ contentType: 'application/pdf', sizeBytes: 250_880 })).toBe('PDF, 245 KB');
    expect(attachmentLabel({ contentType: 'image/jpeg', sizeBytes: 2_621_440 })).toBe('JPEG, 2,5 MB');
    expect(attachmentLabel({ contentType: DOCX_TYPE, sizeBytes: 20_480 })).toBe('Word, 20 KB');
    expect(attachmentLabel({ contentType: 'image/png', sizeBytes: 10 })).toBe('PNG, 10 B');
  });
});

describe('attachmentErrorMessage', () => {
  it('says that the attachment is not there when the answer is 404', () => {
    expect(attachmentErrorMessage(apiError(404))).toContain('non è disponibile');
  });

  it('says that the user cannot download it when the answer is 403', () => {
    expect(attachmentErrorMessage(apiError(403))).toContain('Non hai i permessi');
  });

  it('uses the common messages for everything else', () => {
    expect(attachmentErrorMessage(apiError(500))).toContain('errore imprevisto');
    expect(attachmentErrorMessage(apiError(0, 'NETWORK_ERROR'))).toContain('non raggiungibile');
  });
});
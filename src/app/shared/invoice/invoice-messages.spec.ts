import { ApiError } from '../http/api-error';
import { invoiceDownloadErrorMessage, issueErrorMessage } from './invoice-messages';

const error = (status: number, code: string): ApiError => ({ status, code, message: 'x' });

describe('issueErrorMessage', () => {
  it('says that the price is missing in the list when the server finds nothing', () => {
    expect(issueErrorMessage(error(404, 'RESOURCE_NOT_FOUND'))).toContain('manca il prezzo');
  });

  it('uses the usual messages for everything else', () => {
    expect(issueErrorMessage(error(409, 'INVALID_STATE_TRANSITION'))).toContain('Operazione non consentita');
    expect(issueErrorMessage(error(500, 'SERVER_ERROR'))).toContain('errore imprevisto');
  });
});

describe('invoiceDownloadErrorMessage', () => {
  it('says that the invoice is not there when the answer is 404', () => {
    expect(invoiceDownloadErrorMessage(error(404, 'SERVER_ERROR'))).toContain('non è disponibile');
  });

  it('says that the user cannot download it when the answer is 403', () => {
    expect(invoiceDownloadErrorMessage(error(403, 'SERVER_ERROR'))).toContain('Non hai i permessi');
  });

  it('uses the usual messages for everything else', () => {
    expect(invoiceDownloadErrorMessage(error(500, 'SERVER_ERROR'))).toContain('errore imprevisto');
  });
});
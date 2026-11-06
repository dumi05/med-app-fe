import { ApiError } from "../http/api-error";
import { userMessage } from "../http/error-messages";

export function issueErrorMessage(err: ApiError): string {
    if(err.code === 'RESOURCE_NOT_FOUND'){
        return 'Nel listino manca il prezzo di questa visita: chiedi all\'amministratore di inserirlo.';
    }
    return userMessage(err);
}

export function invoiceDownloadErrorMessage(err: ApiError): string{
    if(err.status === 404){
        return 'La fattura non è disponibile.';
    }
    if(err.status === 403){
        return 'Non hai i permessi per scaricare questa fattura.';
    }
    return userMessage(err);
}
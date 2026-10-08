import { ApiError } from './api-error';

const MESSAGES: Record<string,string> = {
    NETWORK_ERROR: "Server non raggiungibile. Riprova piu' tardi.",
    SERVER_ERROR: "Si e' verificato un errore imprevisto. Contatta l'amministratore",
    RESOURCE_NOT_FOUND: "Risorsa non trovata.",
    SLOT_NOT_AVAILABLE: "La fascia oraria scelta non e' piu' disponibile",
    INVALID_STATE_TRANSITION: "Operazione non consentita nello stato attuale",
    UNAUTHORIZED_ACCESS: "Non hai i permessi per eseguire questa operazione.",
    INVALID_ARGUMENT: "I dati inseriti non sono validi.",
    VALIDATION_FAILED: "Controlla i campi evidenziati e riprova."
};

export function userMessage(error: ApiError): string {
    return MESSAGES[error.code] ?? MESSAGES['SERVER_ERROR'];
}
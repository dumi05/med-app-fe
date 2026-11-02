import { ApiError } from './api-error';

const MESSAGES: Record<string,string> = {
    NETWORK_ERROR: "Server non raggiungibile. Riprova piu' tardi.",
    SERVER_ERROR: "Si e' verificato un errore imprevisto. Contatta l'amministratore",
    RESOURCE_NOT_FOUND: "Risorsa non trovata.",
    SLOT_NOT_AVAILABLE: "La fascia oraria scelta non e' piu' disponibile",
    INVALID_STATE_TRANSITION: "Operazione non consentita nello stato attuale",
    UNAUTHORIZED_ACCESS: "Non hai i permessi per eseguire questa operazione.",
    INVALID_ARGUMENT: "I dati inseriti non sono validi.",
    VALIDATION_FAILED: "Controlla i campi evidenziati e riprova.",
    INVALID_CREDENTIALS: "Email o password non corrette.",
    CONCURRENT_MODIFICATION: "La risorsa e' stata modificata da un altro utente. Riprova.",
    UNAUTHENTICATED: "Autenticazione non riuscita.",
    WEAK_PASSWORD: "La password non è abbastanza sicura: scegline una più lunga e meno prevedibile.",
    INVALID_CURRENT_PASSWORD: "La password attuale non è corretta.",
    ACCOUNT_LOCKED: "Troppi tentativi di accesso falliti. Riprova tra qualche minuto.",
    PASSWORD_CHANGE_REQUIRED: "Devi cambiare la password prima di continuare.",
    SLOT_OVERLAP: "Esistono gia' slot in quella fascia oraria.",
    APPOINTMENT_OVERLAP: "Hai gia' una prenotazione in quella fascia oraria.",
    EMAIL_ALREADY_IN_USE: "Questa email è già registrata.",
    SPECIALIZATION_ALREADY_EXISTS: "Esiste già una specializzazione con questo nome.",
    INVALID_FILE_TYPE: "Il file non è in un formato valido.",
    FILE_TOO_LARGE: "Il file supera la dimensione massima di 10 MB."
};

const SERVER_TEXT = new Set(["WEAK_PASSWORD", "ACCOUNT_LOCKED"]);

export function userMessage(error: ApiError): string {
    if(SERVER_TEXT.has(error.code) && error.message){
        return error.message;
    }
    return MESSAGES[error.code] ?? MESSAGES['SERVER_ERROR'];
}
import { ApiError } from "../http/api-error";
import { userMessage } from "../http/error-messages";
import { AttachmentInfo } from "./medical-report.model";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const ATTACHMENT_ACCEPT = '.pdf,.docx,image/jpeg,image/png';

const TYPE_NAMES: Record<string, string> = {
    'application/pdf': 'PDF',
    [DOCX_TYPE]: 'Word',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG'
};

export function isAccepted(file: File): boolean {
    return Object.hasOwn(TYPE_NAMES, file.type) || (file.type === '' && file.name.toLowerCase().endsWith('.docx'));
}

export function attachmentProblem(file: File): string | null {
    if (!isAccepted(file)) {
        return 'Sono ammessi solo file PDF, Word (.docx), JPEG e PNG.';
    }
    if(file.size === 0){
        return 'Il file è vuoto.';
    }
    if(file.size > MAX_ATTACHMENT_BYTES){
        return 'Il file supera la dimensione massima di 10 MB.';
    }
    return null;
}

export function formatSize(bytes: number): string {
    if(bytes < 1024){
        return `${bytes} B`;
    }
    if(bytes < 1024 * 1024){
        return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.',',')} MB`;
}

export function attachmentLabel(info: AttachmentInfo): string {
    return `${TYPE_NAMES[info.contentType] ?? 'File'}, ${formatSize(info.sizeBytes)}`;
}

export function attachmentErrorMessage(err: ApiError): string {
    if(err.status === 404){
        return 'L\'allegato non è disponibile.';
    }
    if(err.status === 403){
        return 'Non hai i permessi per scaricare questo allegato.';
    }
    return userMessage(err);
}
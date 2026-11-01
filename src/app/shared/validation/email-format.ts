import { AbstractControl, ValidationErrors } from "@angular/forms";

const MAX_LENGTH = 254;
const MAX_LOCAL_LENGTH = 64;
const LOCAL_PART = /^[A-Za-z0-9._%+-]+$/;
const DOMAIN_LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
const LAST_LABEL = /^[A-Za-z]{2,}$/;

// same logic implemented on Backend side (EmailPolicy)
export function isValidEmail(email: string): boolean {
    const value = email.trim().toLowerCase();
    if(value === '' || value.length > MAX_LENGTH) {
        return false;
    }
    const at = value.indexOf('@');
    if(at <= 0 || at !== value.lastIndexOf('@')){
        return false;
    }
    const local = value.substring(0, at);
    const domain = value.substring(at+1);
    if(local.length > MAX_LOCAL_LENGTH || !LOCAL_PART.test(local)) {
        return false;
    }

    if(local.startsWith('.') || local.endsWith('.') || local.includes('..')){
        return false;
    }
    const labels = domain.split('.');
    if(labels.length < 2 || !labels.every((label) => DOMAIN_LABEL.test(label))){
        return false;
    }

    return LAST_LABEL.test(labels[labels.length - 1]);
}

export function emailFormat(control: AbstractControl<string>): ValidationErrors | null {
    return control.value === '' || isValidEmail(control.value) ? null : { emailFormat: true };
}
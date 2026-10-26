import { Appointment } from "../appointment/appointment.model";
import { MedicalReport } from "../report/medical-report.model";

export interface PatientProfile {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    gdprConsent: boolean;
    gdprConsentVersion: string;
    gdprConsentTimestamp: string;
}

export interface PatientDataExport {
    profile: PatientProfile;
    appointments: Appointment[];
    reports: MedicalReport[];
}
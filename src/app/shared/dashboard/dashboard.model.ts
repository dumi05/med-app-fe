import { AppointmentStatus } from "../appointment/appointment.model";

export interface SpecializationRevenue {
    specialization: string;
    revenue: number;
}

export interface DashboardKpi {
    totalAppointments: number;
    appointmentsByStatus: Record<AppointmentStatus, number>;
    upcomingAtRisk: number;
    attendanceRate: number;
    totalRevenue: number;
    revenueBySpecialization: SpecializationRevenue[];
}
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { PatientSearchService, PatientSummary, searchIsLongEnough } from "../../patient/patient-search.service";
import { DoctorService } from "../../doctor/doctor.service";
import { ScheduleService } from "../../schedule/schedule.service";
import { AppointmentService } from "../../appointment/appointment.service";
import { AuthService } from "../../auth/auth.service";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { AlertMessage } from "../../ui/alert-message/alert-message";
import { FormField } from "../../ui/form-field/form-field";
import { SelectField, SelectOption } from "../../ui/select-field/select-field";
import { Doctor } from "../../doctor/doctor.model";
import { toSignal } from "@angular/core/rxjs-interop";
import { Slot } from "../../schedule/slot.model";
import { formatEuro, todayIso } from "../../format/format";
import { addDays, dayLabel, shortDayLabel } from "../../calendar/calendar-grid";
import { dayOf, timeOf } from "../../schedule/slot-time";
import { ApiError } from "../../http/api-error";
import { userMessage } from "../../http/error-messages";

const LIST_DAYS = 30;
const PAGE_SIZE = 10;
const STALE_CODES = ['SLOT_NOT_AVAILABLE', 'CONCURRENT_MODIFICATION', 'APPOINTMENT_OVERLAP'];

@Component({
    selector: 'app-booking-for-patient',
    imports: [ReactiveFormsModule, AlertMessage, FormField, SelectField],
    templateUrl: './book-for-patient.html'
})
export class BookForPatient implements OnInit {
    
    private readonly patientSearch = inject(PatientSearchService);
    private readonly doctorService = inject(DoctorService);
    private readonly scheduleService = inject(ScheduleService);
    private readonly appointmentService = inject(AppointmentService);
    private readonly authService = inject(AuthService);

    protected readonly isAdmin = this.authService.role() == 'ADMIN';

    protected readonly searchControl = new FormControl('', {
        nonNullable: true,
        validators: [(control) => (searchIsLongEnough(control.value) ? null : { tooShort: true })]
    });
    protected readonly searchForm = new FormGroup({ query: this.searchControl });
    protected readonly results = signal<PatientSummary[] | null>(null);
    protected readonly patient = signal<PatientSummary | null>(null);
    protected readonly searching = signal(false);

    private readonly doctors = signal<Doctor[]>([]);
    protected readonly doctorControl = new FormControl('', { nonNullable: true });
    private readonly doctorValue = toSignal(this.doctorControl.valueChanges, { initialValue: '' });
    protected readonly doctorOptions = computed<SelectOption[]>(() =>
        this.doctors().map((doctor) => ({ value: String(doctor.id), label: `${doctor.lastName} ${doctor.firstName} (${doctor.specialization})` })));
    protected readonly doctor = computed(() => this.doctors().find((candidate) => String(candidate.id) === this.doctorValue()) ?? null);

    protected readonly slots = signal<Slot[] | null>(null);
    protected readonly visibleCount = signal(PAGE_SIZE);
    protected readonly shownSlots = computed(() => (this.slots() ?? []).slice(0, this.visibleCount()));
    protected readonly hasMore = computed(() => (this.slots()?.length ?? 0) > this.visibleCount());
    protected readonly pendingSlot = signal<Slot | null>(null);
    protected readonly booking = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly success = signal<string | null>(null);

    protected readonly euro = formatEuro;
    protected readonly shortDayLabel = shortDayLabel;
    protected readonly dayOf = dayOf;
    protected readonly timeOf = timeOf;

    ngOnInit(): void {
        if(this.isAdmin){
            this.doctorService.getAllDoctorsForAdmin().subscribe({
                next: (list) => this.doctors.set(list.filter((doc) => doc.active)),
                error: (err: ApiError) => {
                    this.error.set(userMessage(err));
                }
            });
        } else {
            this.doctorService.getMe().subscribe({
                next: (me) => {
                    this.doctors.set([me]);
                    this.doctorControl.setValue(String(me.id));
                },
                error: (err: ApiError) => {
                    this.error.set(userMessage(err));
                }
            });
        }
        this.doctorControl.valueChanges.subscribe(() => {
            this.pendingSlot.set(null);
            this.visibleCount.set(PAGE_SIZE);
            this.loadSlots();
        });
    }

    protected search(): void {
        const query = this.searchControl.value;
        if(!searchIsLongEnough(query)){
            this.searchControl.markAsTouched();
            return;
        }
        this.searching.set(true);
        this.error.set(null);
        this.patientSearch.search(query).subscribe({
            next: (res) => {
                this.results.set(res);
                this.searching.set(false);
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.searching.set(false);
            }
        });
    }

    protected choose(patient: PatientSummary): void {
        this.patient.set(patient);
        this.results.set(null);
        this.error.set(null);
        this.success.set(null);
        this.loadSlots();
    }

    protected changePatient():void {
        this.patient.set(null);
        this.pendingSlot.set(null);
    }

    protected showMore(): void {
        this.visibleCount.update((count) => count + PAGE_SIZE);
    }

    protected ask(slot: Slot): void {
        this.error.set(null);
        this.success.set(null);
        this.pendingSlot.set(slot);
    }

    protected cancel(): void {
        this.pendingSlot.set(null);
    }

    protected when(slot: Slot): string {
        return `${dayLabel(dayOf(slot.startTime))} alle ${timeOf(slot.startTime)}`;
    }

    protected confirm(): void {
        const slot = this.pendingSlot();
        const patient = this.patient();
        if(slot === null || patient === null){
            return;
        }
        this.booking.set(true);
        this.error.set(null);
        this.success.set(null);
        this.appointmentService.createAppointment(slot.id, patient.id).subscribe({
            next: () => {
                this.success.set(`Visita prenotata per ${patient.firstName} ${patient.lastName}: ${this.when(slot)}.`);
                this.booking.set(false);
                this.pendingSlot.set(null);
                this.loadSlots();
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.pendingSlot.set(null);
                this.booking.set(false);
                if(STALE_CODES.includes(err.code)){
                    this.loadSlots();
                }
            }
        });
    }

    private loadSlots(): void {
        const doctor = this.doctor();
        if(doctor === null || this.patient() === null){
            return;
        }
        const today = todayIso();
        this.scheduleService.searchAvailability({ 
            specializationId: doctor.specializationId, 
            doctorId: doctor.id, 
            from: today, 
            to: addDays(today, LIST_DAYS - 1)
        }).subscribe({
            next: (slots) => this.slots.set(slots),
            error: (err: ApiError) => this.error.set(userMessage(err))    
        })
    }
    
}
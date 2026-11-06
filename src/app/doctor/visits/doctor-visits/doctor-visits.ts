import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadge, statusLabel } from '../../../shared/status-badge/status-badge';
import { AlertMessage } from '../../../shared/ui/alert-message/alert-message';
import { AppointmentService } from '../../../shared/appointment/appointment.service';
import { Appointment, hasReport } from '../../../shared/appointment/appointment.model';
import { ApiError } from '../../../shared/http/api-error';
import { userMessage } from '../../../shared/http/error-messages';
import { DataTable, DataTableColumn, DataTableRow } from '../../../shared/ui/data-table/data-table';
import { formatDateTime, formatEuro } from '../../../shared/format/format';
import { InvoiceService } from '../../../shared/invoice/invoice.service';
import { issueErrorMessage } from '../../../shared/invoice/invoice-messages';

@Component({
  selector: 'app-doctor-visits',
  imports: [DatePipe,RouterLink, StatusBadge, AlertMessage, DataTable, DataTableRow],
  templateUrl: './doctor-visits.html',
})
export class DoctorVisits implements OnInit{

  private readonly appointmentService = inject(AppointmentService);
  private readonly invoiceService = inject(InvoiceService);

  protected readonly appointments = signal<Appointment[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly completingId = signal<number | null>(null);
  protected readonly hasReport = hasReport;
  protected readonly confirmingInvoiceId = signal<number | null>(null);
  protected readonly invoicingId = signal<number | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly columns: DataTableColumn<Appointment>[] = [
    { header: 'Data e ora', value: (app) => app.slot.startTime, text: (app) => formatDateTime(app.slot.startTime) },
    { header: 'Paziente', value: (app) => `${app.patientLastName} ${app.patientFirstName}`, text: (app) => `${app.patientFirstName} ${app.patientLastName}` },
    { header: 'Stato', value: (app) => statusLabel(app.status) },
    { header: 'Rischio', value: (app) => (app.noShowRisk ? 1 : 0), text: (app) => (app.noShowRisk ? 'rischio no-show' : '') },
    { header: '' },
  ];
  protected readonly rowKey = (app: Appointment) => app.id;

  ngOnInit(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (app) => this.appointments.set(app),
      error: (err: ApiError) => this.error.set(userMessage(err))
    });
  }

  protected complete(app: Appointment): void {
    this.completingId.set(app.id);
    this.error.set(null);
    this.success.set(null);

    this.appointmentService.completeVisit(app.id).subscribe({
      next: (updated) => {
        this.appointments.update((appList) => appList?.map((a) => (a.id === updated.id ? updated : a)) ?? null);
        this.completingId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.completingId.set(null);
      }
    })

  }

  protected askInvoice(app: Appointment): void{
    this.confirmingInvoiceId.set(app.id);
  }

  protected cancelInvoice(): void {
    this.confirmingInvoiceId.set(null);
  }

  protected invoice(app: Appointment): void {
    this.invoicingId.set(app.id);
    this.error.set(null);
    this.success.set(null);

    this.invoiceService.issue(app.id).subscribe({
      next: (invoice) => {
        this.appointments.update((list) => list?.map((x) => (x.id === app.id ? { ...x, status: 'INVOICED'} : x)) ?? null);
        this.success.set(`Pagamento registrato: fattura ${invoice.number} di ${formatEuro(invoice.amount)}. Ora puoi scrivere il referto.`);
        this.confirmingInvoiceId.set(null);
        this.invoicingId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(issueErrorMessage(err));
        this.confirmingInvoiceId.set(null);
        this.invoicingId.set(null);
      }
    });
  }

}

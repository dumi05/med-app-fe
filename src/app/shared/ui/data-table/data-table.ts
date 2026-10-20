import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, Directive, input, signal, TemplateRef } from "@angular/core";

export interface DataTableColumn<T> {
    header: string;
    value?: (row: T) => string | number;
    text?: (row: T) => string;
}

@Directive({ selector: 'ng-template[appDataTableRow]' })
export class DataTableRow<T> {
    readonly rows = input.required<T[]>({ alias: 'appDataTableRow'});

    static ngTemplateContextGuard<T> (_directive: DataTableRow<T>, context: unknown): context is { $implicit: T} {
        return true;
    }
}

type SortState = { column: number; direction: 'asc' | 'desc'};

@Component({
    selector: 'app-data-table',
    imports: [NgTemplateOutlet],
    templateUrl: './data-table.html',
})
export class DataTable<T> {
    readonly columns = input.required<DataTableColumn<T>[]>();
    readonly rows = input.required<T[]>();
    readonly rowKey = input.required<(row: T) => string | number>();
    readonly filterable = input(true);

    protected readonly rowTemplate = contentChild.required(DataTableRow, { read: TemplateRef });
    protected readonly filter = signal('');
    protected readonly sort = signal<SortState | null>(null);

    protected readonly visibleRows = computed(() => {
        const columns = this.columns();
        const term = this.filter().trim().toLowerCase();

        let result = this.rows();
        if( term != '' ){
            result = result.filter((row) => columns.some((c) => this.textOf(c, row).toLowerCase().includes(term)));
        }

        const sort = this.sort();
        const sortColumn = sort === null ? undefined : columns[sort.column];
        if(sort !== null && sortColumn?.value){
            const read = sortColumn.value;
            const factor = sort.direction === 'asc' ? 1 : -1;
            result = [...result].sort((a,b) => factor * this.compare(read(a), read(b)));
        }
        return result;
    });

    protected onFilter(event: Event): void {
        this.filter.set((event.target as HTMLInputElement).value);
    }

    protected toggleSort(column: number): void {
        const current = this.sort();
        if(current === null || current.column !== column) {
            this.sort.set({ column, direction: 'asc'});
        } else if(current.direction === 'asc') {
            this.sort.set({ column, direction: 'desc'});
        } else {
            this.sort.set(null);
        }
    }

    protected ariaSort (column: number): 'ascending' | 'descending' | 'none' {
        const current = this.sort();
        if(current === null || current.column !== column) {
            return 'none';
        }

        return current.direction === 'asc' ? 'ascending' : 'descending';
    }

    protected indicator(column: number): string {
        const state = this.ariaSort(column);
        return state === 'ascending' ? ' ▲': state === 'descending' ? ' ▼': '';
    }

    private textOf(column: DataTableColumn<T>, row: T): string {
        if(column.text) {
            return column.text(row);
        }
        return column.value ? String(column.value(row)) : '';
    }

    private compare(a: string | number, b: string | number): number {
        if(typeof a === 'number' && typeof b === 'number') {
            return a-b;
        }
        return String(a).localeCompare(String(b), 'it', { numeric: true, sensitivity: 'base'});
    }
}

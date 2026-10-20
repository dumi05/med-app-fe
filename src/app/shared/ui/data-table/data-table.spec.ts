import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTable, DataTableColumn, DataTableRow } from './data-table';

interface Person {
  id: number;
  name: string;
  age: number;
}

@Component({
  imports: [DataTable, DataTableRow],
  template: `
    <app-data-table [columns]="columns" [rows]="rows" [rowKey]="rowKey" [filterable]="filterable">
      <ng-template [appDataTableRow]="rows" let-person>
        <tr><td>{{ person.name }}</td><td>{{ person.age }}</td><td><button type="button" class="action">Azione</button></td></tr>
      </ng-template>
    </app-data-table>
  `,
})
class HostComponent {
  rows: Person[] = [
    { id: 1, name: 'Carla', age: 40 },
    { id: 2, name: 'Anna', age: 30 },
    { id: 3, name: 'Bruno', age: 100 },
  ];
  columns: DataTableColumn<Person>[] = [
    { header: 'Nome', value: (person) => person.name },
    { header: 'Età', value: (person) => person.age, text: (person) => `${person.age} anni` },
    { header: '' },
  ];
  rowKey = (person: Person) => person.id;
  filterable = true;
}

describe('DataTable', () => {
  let fixture: ComponentFixture<HostComponent>;

  const element = () => fixture.nativeElement as HTMLElement;
  const names = () => Array.from(element().querySelectorAll('tbody tr td:first-child')).map((cell) => cell.textContent);
  const sortButtons = () => Array.from(element().querySelectorAll('button.sort-button')) as HTMLButtonElement[];
  const typeFilter = (value: string) => {
    const input = element().querySelector('input.data-table-filter') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders one row per element with the template of the parent', () => {
    expect(names()).toEqual(['Carla', 'Anna', 'Bruno']);
    expect(element().querySelectorAll('button.action').length).toBe(3);
  });

  it('makes sortable only the columns that have a value', () => {
    expect(sortButtons().length).toBe(2);
    expect(element().querySelectorAll('thead th').length).toBe(3);
  });

  it('sorts ascending, then descending, then goes back to the original order', () => {
    sortButtons()[0].click();
    fixture.detectChanges();
    expect(names()).toEqual(['Anna', 'Bruno', 'Carla']);
    expect(element().querySelector('thead th')!.getAttribute('aria-sort')).toBe('ascending');

    sortButtons()[0].click();
    fixture.detectChanges();
    expect(names()).toEqual(['Carla', 'Bruno', 'Anna']);
    expect(element().querySelector('thead th')!.getAttribute('aria-sort')).toBe('descending');

    sortButtons()[0].click();
    fixture.detectChanges();
    expect(names()).toEqual(['Carla', 'Anna', 'Bruno']);
  });

  it('sorts numbers by value, not as text (100 comes after 40)', () => {
    sortButtons()[1].click();
    fixture.detectChanges();

    expect(names()).toEqual(['Anna', 'Carla', 'Bruno']);
  });

  it('filters ignoring the case', () => {
    typeFilter('ANNA');

    expect(names()).toEqual(['Anna']);
  });

  it('filters with the text of the column when it has one', () => {
    typeFilter('40 anni');

    expect(names()).toEqual(['Carla']);
  });

  it('says so when nothing matches the filter', () => {
    typeFilter('zzz');

    expect(names()).toEqual(['Nessun risultato.']);
    expect(element().querySelector('td.no-results')!.getAttribute('colspan')).toBe('3');
  });

  it('can hide the filter', () => {
    fixture.componentInstance.filterable = false;
    fixture.detectChanges();

    expect(element().querySelector('input.data-table-filter')).toBeNull();
  });
});
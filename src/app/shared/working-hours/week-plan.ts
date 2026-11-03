import { Band, DayKey, WORKING_DAYS } from "./working-hours.model";

export interface EditableBand {
    start: string;
    end: string;
}

export type Week = Record<DayKey, EditableBand[]>;

export const MIN_BAND_MINUTES = 30;
export const MAX_BANDS_PER_DAY = 3;

export function emptyWeek(): Week {
    return { MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [], FRIDAY: [], SATURDAY: []};
}

export function hoursAndMinutes(time: string): string {
    return time.slice(0, 5);
}

export function weekFrom(bands: Band[]): Week {
    const week = emptyWeek();
    for(const band of bands){
        if(band.dayOfWeek in week){
            week[band.dayOfWeek].push({ start: hoursAndMinutes(band.startTime), end: hoursAndMinutes(band.endTime) });
        }
    }
    for(const day of WORKING_DAYS){
        week[day.key].sort((a,b) => a.start.localeCompare(b.start));
    }
    return week;
}

export function bandsFrom(week: Week): Band[] {
    return WORKING_DAYS.flatMap(
        (day) => [...week[day.key]]
                    .sort((a,b) => a.start.localeCompare(b.start))
                    .map((band) => ({ dayOfWeek: day.key, startTime: band.start, endTime: band.end })
                ));
}

const minutes = (time: string) => Number(time.slice(0,2)) * 60 + Number(time.slice(3,5));

export function problemOf(bands: EditableBand[]): string | null {
    if(bands.length > MAX_BANDS_PER_DAY){
        return `Al massimo ${MAX_BANDS_PER_DAY} fasce per giorno.`;
    }
    for(const band of bands){
        if(band.start === '' || band.end === ''){
            return 'Indica l\'inizio e la fine di ogni fascia.';
        }
        if(minutes(band.end) <= minutes(band.start)){
            return 'In ogni fascia la fine deve essere dopo l\'inizio.';
        }
        if(minutes(band.end) - minutes(band.start) < MIN_BAND_MINUTES){
            return `Ogni fascia deve durare almeno ${MIN_BAND_MINUTES} minuti.`;
        }
        if(minutes(band.start) % 5 !== 0 || minutes(band.end) % 5 !== 0){
            return 'Gli orari devono essere multipli di 5 minuti.';
        }
    }
    const sorted = [...bands].sort((a,b) => a.start.localeCompare(b.start));
    for(let i = 1; i < sorted.length; i++){
        if(minutes(sorted[i].start) < minutes(sorted[i-1].end)){
            return 'Due fasce dello stesso giorno non possono sovrapporsi.';
        }
    }
    return null;
}

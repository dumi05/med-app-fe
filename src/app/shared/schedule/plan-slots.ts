export const MIN_SLOT_MINUTES = 5;
export const MAX_SLOT_MINUTES = 240;
export const MAX_SLOTS_PER_REQUEST = 48;

const toMinutes = (time: string): number=> Number(time.slice(0,2)) * 60 + Number(time.slice(3,5));
const toTime = (minutes: number): string => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes%60).padStart(2, '0')}`; 

export function planSlots(start:string, end:string, minutes:number): string[] {
    if(!start || !end || !Number.isInteger(minutes) || minutes < 1) {
        return [];
    }

    const result: string[] = [];

    for(let t = toMinutes(start); t + minutes <= toMinutes(end); t+= minutes) {
        result.push(toTime(t));
    }
    return result;
}

export function planProblem(start: string, end: string, minutes: number): string | null {
    if(!start || !end) {
        return null;
    }

    if(!Number.isInteger(minutes) || minutes < MIN_SLOT_MINUTES || minutes > MAX_SLOT_MINUTES){
        return `La durata deve essere tra ${MIN_SLOT_MINUTES} e ${MAX_SLOT_MINUTES} minuti.`;
    }

    if(end <= start) {
        return "L'orario di fine deve essere dopo quello di inizio.";
    }

    const count = planSlots(start, end, minutes).length;

    if(count === 0) {
        return 'La fascia oraria è più corta di una visita.';
    }

    if(count > MAX_SLOTS_PER_REQUEST) {
        return `Al massimo ${MAX_SLOTS_PER_REQUEST} slot per volta: accorcia la fascia o allunga la durata.`;
    }

    return null;
    
}
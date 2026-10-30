import { downloadBlob } from "./download-blob";

export function downloadJson(filename: string, data: unknown): void {
    downloadBlob(filename, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json'}));
}